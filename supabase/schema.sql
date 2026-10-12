-- =============================================================================
-- eBoi database schema
-- Run this whole file once in Supabase Dashboard > SQL Editor > New query.
-- It is idempotent where practical (safe to re-run after edits to functions,
-- policies and buckets). Tables use "create table if not exists".
--
-- After running it:
--   1. Authentication > Sign In / Providers: turn OFF "Allow new users to sign up".
--   2. Authentication > Users > Add user: create your admin (email + password,
--      tick "Auto Confirm User").
--   3. Run this one line with that email to make the user an admin:
--        insert into public.admin_users (user_id)
--        select id from auth.users where email = 'you@example.com';
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.book_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.book_badge as enum ('none', 'new', 'bestseller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.discount_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.offer_scope as enum ('all', 'books', 'collections');
exception when duplicate_object then null; end $$;

-- Collections carry a visual "mood" so the home page does not look like one
-- repeated grid. paper = light with heavy rules, forest = deep green panel,
-- ink = outlined, dense list.
do $$ begin
  create type public.collection_mood as enum ('paper', 'forest', 'ink');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Admin
-- -----------------------------------------------------------------------------
-- WHY a table instead of an email check: the admin can be changed with one
-- insert/delete, and RLS stays a cheap indexed lookup.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
end;
$$;

-- Shared updated_at trigger
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Offers (created before books because a book can reference one offer)
-- -----------------------------------------------------------------------------
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 80),
  banner_text text not null default '' check (char_length(banner_text) <= 160),
  discount_type public.discount_type not null,
  value numeric(10, 2) not null check (value > 0),
  applies_to public.offer_scope not null default 'all',
  start_at timestamptz not null default now(),
  end_at timestamptz,
  show_countdown boolean not null default false,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_percent_cap check (discount_type <> 'percent' or value <= 90),
  constraint offers_window check (end_at is null or end_at > start_at)
);

drop trigger if exists offers_touch on public.offers;
create trigger offers_touch before update on public.offers
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Books
-- -----------------------------------------------------------------------------
create sequence if not exists public.book_code_seq;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  -- Human ID used in WhatsApp messages and the admin. Never reused.
  book_code text not null unique
    default ('EB-' || lpad(nextval('public.book_code_seq')::text, 4, '0'))
    check (book_code ~ '^EB-[0-9]{4,}$'),
  title text not null check (char_length(title) between 1 and 160),
  subtitle text check (subtitle is null or char_length(subtitle) <= 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  author text not null default '',
  category text not null default 'General',
  tags text[] not null default '{}',
  language text not null default 'English',
  page_count integer check (page_count is null or page_count > 0),
  format text not null default 'PDF',
  -- Size of the FULL pdf (which never leaves your computer), e.g. "8.4 MB".
  file_size text,
  description text not null default '',
  highlights text[] not null default '{}',
  table_of_contents text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  old_price numeric(10, 2) check (old_price is null or old_price >= 0),
  offer_id uuid references public.offers (id) on delete set null,
  -- DISPLAY values (editable). Real tracked numbers live in events/sales_log.
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  total_sells integer not null default 0 check (total_sells >= 0),
  views integer not null default 0 check (views >= 0),
  release_date date,
  is_featured boolean not null default false,
  status public.book_status not null default 'draft',
  badge public.book_badge not null default 'none',
  seo_title text,
  seo_description text,
  cover_path text,
  preview_path text,
  -- Pages in the uploaded preview, counted on upload. Shown as "8-page preview".
  preview_page_count integer check (preview_page_count is null or preview_page_count > 0),
  internal_file_note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_status_idx on public.books (status, release_date desc);
create index if not exists books_category_idx on public.books (category);

drop trigger if exists books_touch on public.books;
create trigger books_touch before update on public.books
  for each row execute function public.touch_updated_at();

-- Keep the code sequence ahead of imported codes (e.g. an export re-imported
-- on a fresh database) so a new book never collides with an old ID.
create or replace function public.books_sync_code_seq()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
begin
  n := substring(new.book_code from '^EB-([0-9]+)$')::bigint;
  -- "next value the sequence would hand out" must stay above every used code.
  if n is not null and n >= (
    select case when is_called then last_value + 1 else last_value end
    from public.book_code_seq
  ) then
    perform setval('public.book_code_seq', n, true);
  end if;
  return new;
end;
$$;

drop trigger if exists books_code_seq on public.books;
create trigger books_code_seq after insert on public.books
  for each row execute function public.books_sync_code_seq();

-- Slug history: old book URLs must keep working forever.
create table if not exists public.book_slug_history (
  old_slug text primary key,
  book_id uuid not null references public.books (id) on delete cascade,
  changed_at timestamptz not null default now()
);

create or replace function public.books_slug_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A retired slug belongs to its original book. Giving it to a different
  -- book would silently hijack links that were shared on WhatsApp.
  if exists (
    select 1 from public.book_slug_history h
    where h.old_slug = new.slug and h.book_id <> new.id
  ) then
    raise exception 'The slug "%" was used by another book before. Pick a different one.', new.slug
      using errcode = '23505';
  end if;

  if tg_op = 'UPDATE' and new.slug <> old.slug then
    insert into public.book_slug_history (old_slug, book_id)
    values (old.slug, old.id)
    on conflict (old_slug) do update set book_id = excluded.book_id, changed_at = now();
    -- Renaming back to an earlier slug: it is live again, not history.
    delete from public.book_slug_history where old_slug = new.slug;
  end if;
  return new;
end;
$$;

drop trigger if exists books_slug_guard on public.books;
create trigger books_slug_guard before insert or update of slug on public.books
  for each row execute function public.books_slug_guard();

-- -----------------------------------------------------------------------------
-- Collections
-- -----------------------------------------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  description text not null default '',
  editorial_intro text not null default '',
  mood public.collection_mood not null default 'paper',
  sort_order integer not null default 0,
  show_on_home boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- These slugs are computed collections served by the app itself.
  constraint collections_reserved_slug check (slug not in ('best-selling', 'latest', 'most-viewed'))
);

drop trigger if exists collections_touch on public.collections;
create trigger collections_touch before update on public.collections
  for each row execute function public.touch_updated_at();

create table if not exists public.collection_books (
  collection_id uuid not null references public.collections (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  position integer not null default 0,
  primary key (collection_id, book_id)
);
create index if not exists collection_books_book_idx on public.collection_books (book_id);

create table if not exists public.collection_slug_history (
  old_slug text primary key,
  collection_id uuid not null references public.collections (id) on delete cascade,
  changed_at timestamptz not null default now()
);

create or replace function public.collections_slug_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.collection_slug_history h
    where h.old_slug = new.slug and h.collection_id <> new.id
  ) then
    raise exception 'The slug "%" was used by another collection before.', new.slug
      using errcode = '23505';
  end if;
  if tg_op = 'UPDATE' and new.slug <> old.slug then
    insert into public.collection_slug_history (old_slug, collection_id)
    values (old.slug, old.id)
    on conflict (old_slug) do update set collection_id = excluded.collection_id, changed_at = now();
    delete from public.collection_slug_history where old_slug = new.slug;
  end if;
  return new;
end;
$$;

drop trigger if exists collections_slug_guard on public.collections;
create trigger collections_slug_guard before insert or update of slug on public.collections
  for each row execute function public.collections_slug_guard();

-- Offer targets
create table if not exists public.offer_books (
  offer_id uuid not null references public.offers (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  primary key (offer_id, book_id)
);

create table if not exists public.offer_collections (
  offer_id uuid not null references public.offers (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  primary key (offer_id, collection_id)
);

-- -----------------------------------------------------------------------------
-- Sales log. Snapshots keep revenue history even after a book is deleted.
-- -----------------------------------------------------------------------------
create table if not exists public.sales_log (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books (id) on delete set null,
  book_title_snapshot text not null,
  book_code_snapshot text,
  price_snapshot numeric(10, 2) not null check (price_snapshot >= 0),
  sold_at timestamptz not null default now(),
  note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sales_log_sold_at_idx on public.sales_log (sold_at desc);
create index if not exists sales_log_book_idx on public.sales_log (book_id, sold_at desc);

-- A logged sale bumps the public "total sells" counter so the admin never has
-- to update it by hand. Deleting a mistaken entry rolls it back.
create or replace function public.sales_log_sync_sells()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') and new.book_id is not null then
    update public.books set total_sells = total_sells + 1 where id = new.book_id;
  end if;
  if tg_op in ('DELETE', 'UPDATE') and old.book_id is not null then
    update public.books set total_sells = greatest(total_sells - 1, 0) where id = old.book_id;
  end if;
  return null;
end;
$$;

drop trigger if exists sales_log_sync_sells on public.sales_log;
create trigger sales_log_sync_sells after insert or delete or update of book_id on public.sales_log
  for each row execute function public.sales_log_sync_sells();

-- -----------------------------------------------------------------------------
-- Analytics events. No IP address is ever stored.
-- -----------------------------------------------------------------------------
create table if not exists public.events (
  id bigint generated always as identity primary key,
  type text not null check (type in (
    'page_view', 'book_view', 'section_view', 'book_click', 'search', 'filter',
    'preview_open', 'preview_page', 'whatsapp_click', 'whatsapp_open', 'copy_click', 'list_add'
  )),
  book_id uuid references public.books (id) on delete set null,
  section text check (section is null or char_length(section) <= 60),
  anon_id text not null check (char_length(anon_id) between 8 and 64),
  session_id text not null check (char_length(session_id) between 8 and 64),
  path text check (path is null or char_length(path) <= 300),
  referrer text check (referrer is null or char_length(referrer) <= 120),
  device text check (device in ('mobile', 'tablet', 'desktop')),
  term text check (term is null or char_length(term) <= 80),
  result_count integer,
  page integer,
  -- One row per (session, dedupe_key): repeated clicks in a session are noise.
  dedupe_key text not null check (char_length(dedupe_key) <= 200),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists events_dedupe_idx on public.events (session_id, dedupe_key);
create index if not exists events_created_idx on public.events (created_at);
create index if not exists events_type_created_idx on public.events (type, created_at);
create index if not exists events_book_created_idx on public.events (book_id, created_at);

-- Real book views also feed the public "views" display counter.
create or replace function public.events_sync_views()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'book_view' and new.book_id is not null and not new.is_demo then
    update public.books set views = views + 1 where id = new.book_id;
  end if;
  return null;
end;
$$;

drop trigger if exists events_sync_views on public.events;
create trigger events_sync_views after insert on public.events
  for each row execute function public.events_sync_views();

-- -----------------------------------------------------------------------------
-- Site settings: exactly one row (id = 1).
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default 'eBoi',
  tagline text not null default 'PDF only. Premium feel.',
  -- Digits only, with country code, e.g. 8801712345678
  whatsapp_number text not null default '',
  whatsapp_template text not null default
    E'Hi eBoi! I want this PDF:\n\n[Book Title]\nBook ID: [Book ID]\nPrice: [Price]\n\nLink: [Site URL]',
  whatsapp_list_template text not null default
    E'Hi eBoi! I want these PDFs:\n\n[Book List]\n\nTotal: [Total]\nMy list: [Site URL]',
  currency_symbol text not null default '৳',
  announcement text not null default '',
  announcement_active boolean not null default false,
  delivery_note text not null default
    'The PDF arrives in the same WhatsApp chat after payment. Most orders are sent within 30 minutes, 10am to 11pm.',
  about_content text not null default '',
  faq_items jsonb not null default '[]'::jsonb,
  terms_content text not null default '',
  how_to_buy_steps jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

insert into public.site_settings (id, about_content, faq_items, terms_content, how_to_buy_steps)
values (
  1,
  E'eBoi is a one-person PDF bookshop.\n\nEvery book here is a finished, well-set PDF: proper margins, real typography, a table of contents that works. You can read the first pages before you pay, and you buy by sending one WhatsApp message.\n\nNo account, no card form, no app to install. A person answers your message and sends the file.',
  '[
    {"q":"What do I actually get?","a":"One PDF file, sent to you in the WhatsApp chat. It opens on any phone or computer. No app, no account."},
    {"q":"How do I pay?","a":"After you send your message we reply with payment details (bKash, Nagad or bank). Once the payment is confirmed, the PDF is sent in the same chat."},
    {"q":"Can I read some of it first?","a":"Yes. Every book has a free preview of the first pages, right on its page. Read it before you decide."},
    {"q":"How long does delivery take?","a":"Most orders are sent within 30 minutes between 10am and 11pm. Late-night orders go out the next morning."},
    {"q":"Can I buy several books at once?","a":"Add them to My List, then send one message with all of them. We reply with a single total."}
  ]'::jsonb,
  E'Refunds\n\nA PDF cannot be returned once it is sent, so please read the free preview first. If the file you receive is broken, incomplete or the wrong book, tell us in the same chat within 7 days and we will send the right file or refund you in full.\n\nPersonal use\n\nThe PDF is for your own reading. Please do not share or resell it. Each file is prepared for the person who bought it.\n\nPrices\n\nPrices are in Bangladeshi Taka. Offer prices apply to messages sent while the offer is running.',
  '[
    {"title":"Pick a book","body":"Browse the shop or a collection. Every price you see is the final price, offers already applied."},
    {"title":"Read the preview","body":"Open the free preview on the book page and read the first pages."},
    {"title":"Send one message","body":"Tap the WhatsApp button. Your message is already written. Copy it or open WhatsApp and press send."},
    {"title":"Pay and receive","body":"We reply with payment details. After payment the PDF arrives in the same chat."}
  ]'::jsonb
)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.offers enable row level security;
alter table public.books enable row level security;
alter table public.book_slug_history enable row level security;
alter table public.collections enable row level security;
alter table public.collection_books enable row level security;
alter table public.collection_slug_history enable row level security;
alter table public.offer_books enable row level security;
alter table public.offer_collections enable row level security;
alter table public.sales_log enable row level security;
alter table public.events enable row level security;
alter table public.site_settings enable row level security;

-- admin_users: a signed-in user may see only their own row (used to check
-- admin status). Nobody can write through the API.
drop policy if exists admin_users_self on public.admin_users;
create policy admin_users_self on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- books: public sees published rows only; the admin sees and edits everything.
drop policy if exists books_public_read on public.books;
create policy books_public_read on public.books
  for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists books_admin_write on public.books;
create policy books_admin_write on public.books
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- The private reminder of your local file name must never reach visitors.
-- Column grants hide it from the anon role even for published books.
revoke select on public.books from anon;
grant select (
  id, book_code, title, subtitle, slug, author, category, tags, language, page_count,
  format, file_size, description, highlights, table_of_contents, price, old_price,
  offer_id, rating, rating_count, total_sells, views, release_date, is_featured,
  status, badge, seo_title, seo_description, cover_path, preview_path, preview_page_count, is_demo,
  created_at, updated_at
) on public.books to anon;

drop policy if exists book_slug_history_read on public.book_slug_history;
create policy book_slug_history_read on public.book_slug_history
  for select to anon, authenticated using (true);
drop policy if exists book_slug_history_admin on public.book_slug_history;
create policy book_slug_history_admin on public.book_slug_history
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists collections_read on public.collections;
create policy collections_read on public.collections
  for select to anon, authenticated using (true);
drop policy if exists collections_admin on public.collections;
create policy collections_admin on public.collections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists collection_books_read on public.collection_books;
create policy collection_books_read on public.collection_books
  for select to anon, authenticated using (
    public.is_admin() or exists (
      select 1 from public.books b where b.id = book_id and b.status = 'published'
    )
  );
drop policy if exists collection_books_admin on public.collection_books;
create policy collection_books_admin on public.collection_books
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists collection_slug_history_read on public.collection_slug_history;
create policy collection_slug_history_read on public.collection_slug_history
  for select to anon, authenticated using (true);
drop policy if exists collection_slug_history_admin on public.collection_slug_history;
create policy collection_slug_history_admin on public.collection_slug_history
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists offers_read on public.offers;
create policy offers_read on public.offers
  for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists offers_admin on public.offers;
create policy offers_admin on public.offers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists offer_books_read on public.offer_books;
create policy offer_books_read on public.offer_books
  for select to anon, authenticated using (true);
drop policy if exists offer_books_admin on public.offer_books;
create policy offer_books_admin on public.offer_books
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists offer_collections_read on public.offer_collections;
create policy offer_collections_read on public.offer_collections
  for select to anon, authenticated using (true);
drop policy if exists offer_collections_admin on public.offer_collections;
create policy offer_collections_admin on public.offer_collections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists sales_log_admin on public.sales_log;
create policy sales_log_admin on public.sales_log
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- events: written only by the server (/api/track with the service role, which
-- bypasses RLS). The admin can read and delete. Visitors cannot read anything.
drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events
  for select to authenticated using (public.is_admin());
drop policy if exists events_admin_delete on public.events;
create policy events_admin_delete on public.events
  for delete to authenticated using (public.is_admin());

drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists site_settings_admin on public.site_settings;
create policy site_settings_admin on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Explicit grants (newer Supabase projects do not auto-expose new tables).
grant usage on schema public to anon, authenticated, service_role;
grant select on public.collections, public.collection_books, public.offers,
  public.offer_books, public.offer_collections, public.site_settings,
  public.book_slug_history, public.collection_slug_history to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Storage: two PRIVATE buckets. Limits are enforced by Supabase itself, on top
-- of the checks in the admin UI and server actions.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers', 'covers', false, 2097152, array['image/jpeg', 'image/png']),
  ('previews', 'previews', false, 6291456, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only the admin can touch these objects through the API. Visitors get covers
-- through /api/cover/[id] and previews through short-lived signed URLs, both
-- created on the server.
drop policy if exists eboi_storage_admin_select on storage.objects;
create policy eboi_storage_admin_select on storage.objects
  for select to authenticated
  using (bucket_id in ('covers', 'previews') and public.is_admin());

drop policy if exists eboi_storage_admin_insert on storage.objects;
create policy eboi_storage_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('covers', 'previews') and public.is_admin());

drop policy if exists eboi_storage_admin_update on storage.objects;
create policy eboi_storage_admin_update on storage.objects
  for update to authenticated
  using (bucket_id in ('covers', 'previews') and public.is_admin());

drop policy if exists eboi_storage_admin_delete on storage.objects;
create policy eboi_storage_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('covers', 'previews') and public.is_admin());

-- =============================================================================
-- Analytics functions (RPC). All are admin-only: SECURITY DEFINER + an
-- explicit assert_admin() so they also work around the events RLS cleanly.
-- Day buckets use the shop's timezone so "today" means today in Dhaka.
-- =============================================================================

-- Headline numbers for a period. Pass p_book for a single book.
create or replace function public.analytics_summary(
  p_from timestamptz,
  p_to timestamptz,
  p_book uuid default null
)
returns table (
  visitors bigint,
  page_views bigint,
  book_views bigint,
  preview_opens bigint,
  whatsapp_clicks bigint,
  whatsapp_opens bigint,
  copy_clicks bigint,
  list_adds bigint,
  searches bigint,
  sales bigint,
  revenue numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  with ev as (
    select e.type, e.anon_id
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to
      and (p_book is null or e.book_id = p_book)
  ),
  s as (
    select count(*)::bigint as n, coalesce(sum(price_snapshot), 0)::numeric as amt
    from public.sales_log
    where sold_at >= p_from and sold_at < p_to
      and (p_book is null or book_id = p_book)
  )
  select
    count(distinct ev.anon_id)::bigint,
    count(*) filter (where ev.type = 'page_view')::bigint,
    count(*) filter (where ev.type = 'book_view')::bigint,
    count(*) filter (where ev.type = 'preview_open')::bigint,
    count(*) filter (where ev.type = 'whatsapp_click')::bigint,
    count(*) filter (where ev.type = 'whatsapp_open')::bigint,
    count(*) filter (where ev.type = 'copy_click')::bigint,
    count(*) filter (where ev.type = 'list_add')::bigint,
    count(*) filter (where ev.type = 'search')::bigint,
    (select n from s),
    (select amt from s)
  from ev;
end;
$$;

-- One row per day (including empty days) for trend charts.
create or replace function public.analytics_daily(
  p_from timestamptz,
  p_to timestamptz,
  p_book uuid default null,
  p_tz text default 'Asia/Dhaka'
)
returns table (
  day date,
  visitors bigint,
  book_views bigint,
  preview_opens bigint,
  whatsapp_clicks bigint,
  sales bigint,
  revenue numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  with days as (
    select generate_series(
      (p_from at time zone p_tz)::date::timestamp,
      ((p_to - interval '1 second') at time zone p_tz)::date::timestamp,
      interval '1 day'
    )::date as d
  ),
  ev as (
    select (e.created_at at time zone p_tz)::date as d, e.type, e.anon_id
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to
      and (p_book is null or e.book_id = p_book)
  ),
  ev_day as (
    select ev.d,
      count(distinct ev.anon_id)::bigint as visitors,
      count(*) filter (where ev.type = 'book_view')::bigint as book_views,
      count(*) filter (where ev.type = 'preview_open')::bigint as preview_opens,
      count(*) filter (where ev.type = 'whatsapp_click')::bigint as whatsapp_clicks
    from ev group by ev.d
  ),
  s_day as (
    select (sl.sold_at at time zone p_tz)::date as d,
      count(*)::bigint as n, sum(sl.price_snapshot)::numeric as amt
    from public.sales_log sl
    where sl.sold_at >= p_from and sl.sold_at < p_to
      and (p_book is null or sl.book_id = p_book)
    group by 1
  )
  select days.d,
    coalesce(ev_day.visitors, 0),
    coalesce(ev_day.book_views, 0),
    coalesce(ev_day.preview_opens, 0),
    coalesce(ev_day.whatsapp_clicks, 0),
    coalesce(s_day.n, 0),
    coalesce(s_day.amt, 0)
  from days
  left join ev_day on ev_day.d = days.d
  left join s_day on s_day.d = days.d
  order by days.d;
end;
$$;

-- Funnel: distinct sessions that viewed, previewed, tapped WhatsApp; plus sales.
create or replace function public.analytics_funnel(
  p_from timestamptz,
  p_to timestamptz,
  p_book uuid default null
)
returns table (
  viewed bigint,
  previewed bigint,
  clicked bigint,
  sold bigint,
  avg_preview_page numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  with ev as (
    select e.type, e.session_id, e.book_id, e.page
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to
      and (p_book is null or e.book_id = p_book)
  ),
  depth as (
    select max(ev.page) as max_page
    from ev where ev.type = 'preview_page'
    group by ev.session_id, ev.book_id
  )
  select
    count(distinct ev.session_id) filter (where ev.type = 'book_view')::bigint,
    count(distinct ev.session_id) filter (where ev.type = 'preview_open')::bigint,
    count(distinct ev.session_id) filter (where ev.type = 'whatsapp_click')::bigint,
    (select count(*)::bigint from public.sales_log sl
      where sl.sold_at >= p_from and sl.sold_at < p_to
        and (p_book is null or sl.book_id = p_book)),
    (select round(avg(depth.max_page)::numeric, 1) from depth)
  from ev;
end;
$$;

-- Generic label/value breakdowns for bar lists.
--   'referrer'  : where visitors came from (distinct sessions)
--   'device'    : mobile / tablet / desktop (distinct visitors)
--   'section'   : which page sections produced clicks (book, WhatsApp, copy, list)
--   'path'      : most viewed pages
create or replace function public.analytics_breakdown(
  p_from timestamptz,
  p_to timestamptz,
  p_dimension text,
  p_book uuid default null,
  p_limit integer default 10
)
returns table (label text, value bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();

  if p_dimension = 'referrer' then
    return query
    select coalesce(nullif(e.referrer, ''), 'Direct / unknown') as label,
      count(distinct e.session_id)::bigint as value
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to
      and e.type in ('page_view', 'book_view')
      and (p_book is null or e.book_id = p_book)
    group by 1 order by 2 desc limit p_limit;

  elsif p_dimension = 'device' then
    return query
    select coalesce(e.device, 'unknown') as label,
      count(distinct e.anon_id)::bigint as value
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to
      and (p_book is null or e.book_id = p_book)
    group by 1 order by 2 desc limit p_limit;

  elsif p_dimension = 'section' then
    return query
    select coalesce(e.section, 'unknown') as label, count(*)::bigint as value
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to
      and e.type in ('book_click', 'whatsapp_click', 'whatsapp_open', 'copy_click', 'list_add')
      and (p_book is null or e.book_id = p_book)
    group by 1 order by 2 desc limit p_limit;

  elsif p_dimension = 'path' then
    return query
    select coalesce(e.path, '/') as label, count(*)::bigint as value
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to
      and e.type = 'page_view'
    group by 1 order by 2 desc limit p_limit;

  else
    raise exception 'Unknown dimension %', p_dimension;
  end if;
end;
$$;

-- Leaderboard of books for the period.
create or replace function public.analytics_top_books(
  p_from timestamptz,
  p_to timestamptz,
  p_limit integer default 10
)
returns table (
  book_id uuid,
  title text,
  book_code text,
  views bigint,
  preview_opens bigint,
  whatsapp_clicks bigint,
  sales bigint,
  revenue numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  with ev as (
    select e.book_id,
      count(*) filter (where e.type = 'book_view')::bigint as v,
      count(*) filter (where e.type = 'preview_open')::bigint as p,
      count(*) filter (where e.type = 'whatsapp_click')::bigint as w
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to and e.book_id is not null
    group by e.book_id
  ),
  s as (
    select sl.book_id, count(*)::bigint as n, sum(sl.price_snapshot)::numeric as amt
    from public.sales_log sl
    where sl.sold_at >= p_from and sl.sold_at < p_to and sl.book_id is not null
    group by sl.book_id
  )
  select b.id, b.title, b.book_code,
    coalesce(ev.v, 0), coalesce(ev.p, 0), coalesce(ev.w, 0),
    coalesce(s.n, 0), coalesce(s.amt, 0)
  from public.books b
  left join ev on ev.book_id = b.id
  left join s on s.book_id = b.id
  where coalesce(ev.v, 0) + coalesce(ev.w, 0) + coalesce(s.n, 0) > 0
  order by coalesce(s.amt, 0) desc, coalesce(ev.w, 0) desc, coalesce(ev.v, 0) desc
  limit p_limit;
end;
$$;

-- What people searched for, including searches that found nothing.
create or replace function public.analytics_search_terms(
  p_from timestamptz,
  p_to timestamptz,
  p_limit integer default 50
)
returns table (
  term text,
  searches bigint,
  zero_result_searches bigint,
  last_result_count integer,
  last_searched_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  select lower(trim(e.term)) as term,
    count(*)::bigint,
    count(*) filter (where e.result_count = 0)::bigint,
    (array_agg(e.result_count order by e.created_at desc))[1],
    max(e.created_at)
  from public.events e
  where e.created_at >= p_from and e.created_at < p_to
    and e.type = 'search' and e.term is not null and trim(e.term) <> ''
  group by 1
  order by 2 desc, 5 desc
  limit p_limit;
end;
$$;

revoke all on function public.analytics_summary(timestamptz, timestamptz, uuid) from public, anon;
revoke all on function public.analytics_daily(timestamptz, timestamptz, uuid, text) from public, anon;
revoke all on function public.analytics_funnel(timestamptz, timestamptz, uuid) from public, anon;
revoke all on function public.analytics_breakdown(timestamptz, timestamptz, text, uuid, integer) from public, anon;
revoke all on function public.analytics_top_books(timestamptz, timestamptz, integer) from public, anon;
revoke all on function public.analytics_search_terms(timestamptz, timestamptz, integer) from public, anon;
grant execute on function public.analytics_summary(timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.analytics_daily(timestamptz, timestamptz, uuid, text) to authenticated;
grant execute on function public.analytics_funnel(timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.analytics_breakdown(timestamptz, timestamptz, text, uuid, integer) to authenticated;
grant execute on function public.analytics_top_books(timestamptz, timestamptz, integer) to authenticated;
grant execute on function public.analytics_search_terms(timestamptz, timestamptz, integer) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- Revenue summary view for the sales page (admin only through RLS on sales_log).
create or replace view public.sales_by_month
with (security_invoker = true) as
select
  date_trunc('month', sold_at at time zone 'Asia/Dhaka')::date as month,
  count(*)::bigint as sales,
  sum(price_snapshot)::numeric as revenue
from public.sales_log
group by 1;

grant select on public.sales_by_month to authenticated;

-- Done.
