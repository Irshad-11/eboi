-- =============================================================================
-- eBoi update 01: redesign
-- Run once in Supabase > SQL Editor, AFTER schema.sql. Safe to run again.
-- Adds tables and columns only. No data is deleted.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Make your Supabase Auth user an admin (replace the email, then run this line)
-- -----------------------------------------------------------------------------
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR-EMAIL@example.com'   -- <-- your login email
-- on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Books: SEO, cover alt text, preview thumbnails
-- -----------------------------------------------------------------------------
alter table public.books add column if not exists cover_alt text;
alter table public.books add column if not exists focus_keyword text;
alter table public.books add column if not exists seo_keywords text[] not null default '{}';
alter table public.books add column if not exists canonical_url text;
alter table public.books add column if not exists noindex boolean not null default false;
alter table public.books add column if not exists og_image_path text;
alter table public.books add column if not exists preview_thumbs text[] not null default '{}';

-- Visitors may read every column except the private file note.
grant select (
  id, book_code, title, subtitle, slug, author, category, tags, language, page_count,
  format, file_size, description, highlights, table_of_contents, price, old_price,
  offer_id, rating, rating_count, total_sells, views, release_date, is_featured,
  status, badge, seo_title, seo_description, cover_path, preview_path, preview_page_count,
  is_demo, created_at, updated_at, cover_alt, focus_keyword, seo_keywords, canonical_url,
  noindex, og_image_path, preview_thumbs
) on public.books to anon;

-- -----------------------------------------------------------------------------
-- Collections: image, navigation, SEO
-- -----------------------------------------------------------------------------
alter table public.collections add column if not exists image_path text;
alter table public.collections add column if not exists show_in_nav boolean not null default false;
alter table public.collections add column if not exists seo_title text;
alter table public.collections add column if not exists seo_description text;
alter table public.collections add column if not exists focus_keyword text;
alter table public.collections add column if not exists seo_keywords text[] not null default '{}';
alter table public.collections add column if not exists canonical_url text;
alter table public.collections add column if not exists noindex boolean not null default false;
alter table public.collections add column if not exists og_image_path text;

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  icon text not null default 'book',
  image_path text,
  sort_order integer not null default 0,
  show_in_nav boolean not null default true,
  show_on_home boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

-- Renaming a category renames it on every book too.
create or replace function public.categories_rename_books()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.name <> old.name then
    update public.books set category = new.name where category = old.name;
  end if;
  return new;
end;
$$;

drop trigger if exists categories_rename_books on public.categories;
create trigger categories_rename_books after update of name on public.categories
  for each row execute function public.categories_rename_books();

-- Create a category row for every category already used by a book.
insert into public.categories (name, slug)
select distinct on (s.slug) s.name, s.slug
from (
  select b.category as name,
    coalesce(
      nullif(trim(both '-' from lower(regexp_replace(b.category, '[^a-zA-Z0-9]+', '-', 'g'))), ''),
      'category-' || substr(md5(b.category), 1, 6)
    ) as slug
  from public.books b
  where b.category <> ''
) s
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Home page banners (hero carousel)
-- -----------------------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '' check (char_length(title) <= 120),
  subtitle text not null default '' check (char_length(subtitle) <= 200),
  button_label text not null default '' check (char_length(button_label) <= 40),
  link_url text not null default '' check (char_length(link_url) <= 300),
  alt_text text not null default '' check (char_length(alt_text) <= 200),
  bg_color text not null default '#1d5c42' check (bg_color ~ '^#[0-9a-fA-F]{6}$'),
  text_color text not null default '#ffffff' check (text_color ~ '^#[0-9a-fA-F]{6}$'),
  image_desktop_path text,
  image_mobile_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banners_window check (end_at is null or start_at is null or end_at > start_at)
);

drop trigger if exists banners_touch on public.banners;
create trigger banners_touch before update on public.banners
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Book reviews (testimonials entered by the admin)
-- -----------------------------------------------------------------------------
create table if not exists public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  rating smallint not null default 5 check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1500),
  review_date date not null default current_date,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists book_reviews_book_idx on public.book_reviews (book_id, sort_order);

-- -----------------------------------------------------------------------------
-- SEO for fixed pages, and manual redirects
-- -----------------------------------------------------------------------------
create table if not exists public.page_seo (
  page_key text primary key check (page_key in ('home', 'shop', 'about', 'how-to-order', 'faq', 'terms')),
  seo_title text,
  seo_description text,
  focus_keyword text,
  seo_keywords text[] not null default '{}',
  canonical_url text,
  noindex boolean not null default false,
  og_image_path text,
  updated_at timestamptz not null default now()
);

insert into public.page_seo (page_key)
values ('home'), ('shop'), ('about'), ('how-to-order'), ('faq'), ('terms')
on conflict do nothing;

drop trigger if exists page_seo_touch on public.page_seo;
create trigger page_seo_touch before update on public.page_seo
  for each row execute function public.touch_updated_at();

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique check (source_path ~ '^/[^ ]*$' and char_length(source_path) <= 300),
  destination text not null check (char_length(destination) between 1 and 500),
  status_code smallint not null default 301 check (status_code in (301, 302)),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Site settings: new columns
-- -----------------------------------------------------------------------------
alter table public.site_settings add column if not exists announcement_link text not null default '';
alter table public.site_settings add column if not exists announcement_dismissible boolean not null default true;
alter table public.site_settings add column if not exists response_time text not null default '10 minutes';
alter table public.site_settings add column if not exists payment_methods jsonb not null default
  '[{"label":"bKash","number":"","note":"Send Money"},{"label":"Nagad","number":"","note":"Send Money"}]'::jsonb;
alter table public.site_settings add column if not exists header_links jsonb not null default '[]'::jsonb;
alter table public.site_settings add column if not exists footer_columns jsonb not null default
  '[
    {"title":"Shop","links":[{"label":"All books","url":"/shop"},{"label":"Best selling","url":"/collections/best-selling"},{"label":"New arrivals","url":"/collections/latest"}]},
    {"title":"Help","links":[{"label":"How to order","url":"/how-to-order"},{"label":"FAQ","url":"/faq"},{"label":"Refund policy","url":"/terms"}]},
    {"title":"eBoi","links":[{"label":"About us","url":"/about"},{"label":"My List","url":"/my-list"}]}
  ]'::jsonb;
alter table public.site_settings add column if not exists home_sections jsonb not null default
  '[
    {"type":"hero","enabled":true},
    {"type":"categories","enabled":true},
    {"type":"offers","enabled":true},
    {"type":"newest","enabled":true},
    {"type":"best_selling","enabled":true},
    {"type":"latest","enabled":true},
    {"type":"collections","enabled":true},
    {"type":"collection_tiles","enabled":false},
    {"type":"recent","enabled":true},
    {"type":"journey","enabled":true},
    {"type":"faq","enabled":true}
  ]'::jsonb;
alter table public.site_settings add column if not exists how_to_order_content text not null default '';
alter table public.site_settings add column if not exists title_template text not null default '%s | eBoi';
alter table public.site_settings add column if not exists default_meta_description text not null default
  'Buy PDF books in Bangladesh. Read a free preview of every book, order on WhatsApp, pay with bKash or Nagad and get your PDF in minutes.';
alter table public.site_settings add column if not exists default_keywords text[] not null default
  '{eboi,pdf books,bangla pdf book,buy pdf book bangladesh}';
alter table public.site_settings add column if not exists default_og_image_path text;
alter table public.site_settings add column if not exists site_noindex boolean not null default false;
alter table public.site_settings add column if not exists google_verification text not null default
  'hsdg_1mNbuEtI8Q199rubZFV3AF54vBH2k6L7A1Kxk0';
alter table public.site_settings add column if not exists bing_verification text not null default '';

-- Replace the old 4-step order guide with the 5-step journey, only if it was never edited.
update public.site_settings
set how_to_buy_steps = '[
  {"title":"Pick a book","body":"Check the preview if you like."},
  {"title":"Message us on WhatsApp","body":"Copy the ready message so you never have to type."},
  {"title":"We reply within [Response time]","body":"A real person answers your message."},
  {"title":"Pay with bKash or Nagad","body":"Send the total by Send Money. We confirm in the chat."},
  {"title":"Get your PDF on WhatsApp","body":"We send the PDF with your name as a watermark."}
]'::jsonb
where id = 1
  and (how_to_buy_steps = '[]'::jsonb or how_to_buy_steps->0->>'title' = 'Pick a book' and jsonb_array_length(how_to_buy_steps) = 4);

update public.site_settings
set delivery_note = 'Delivered on WhatsApp'
where id = 1 and delivery_note like 'The PDF arrives in the same WhatsApp chat after payment.%';

-- -----------------------------------------------------------------------------
-- Analytics: two new event types
-- -----------------------------------------------------------------------------
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check check (type in (
  'page_view', 'book_view', 'section_view', 'book_click', 'search', 'filter',
  'preview_open', 'preview_page', 'whatsapp_click', 'whatsapp_open', 'copy_click', 'list_add',
  'banner_click', 'share_click'
));

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
      and e.type in ('book_click', 'whatsapp_click', 'whatsapp_open', 'copy_click', 'list_add', 'banner_click', 'share_click')
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

-- -----------------------------------------------------------------------------
-- Row Level Security for the new tables
-- -----------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.banners enable row level security;
alter table public.book_reviews enable row level security;
alter table public.page_seo enable row level security;
alter table public.redirects enable row level security;

drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to anon, authenticated using (true);
drop policy if exists categories_admin on public.categories;
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists banners_read on public.banners;
create policy banners_read on public.banners for select to anon, authenticated using (
  public.is_admin() or (
    is_active
    and (start_at is null or start_at <= now())
    and (end_at is null or end_at > now())
  )
);
drop policy if exists banners_admin on public.banners;
create policy banners_admin on public.banners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists book_reviews_read on public.book_reviews;
create policy book_reviews_read on public.book_reviews for select to anon, authenticated using (
  public.is_admin() or (
    is_visible and exists (select 1 from public.books b where b.id = book_id and b.status = 'published')
  )
);
drop policy if exists book_reviews_admin on public.book_reviews;
create policy book_reviews_admin on public.book_reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists page_seo_read on public.page_seo;
create policy page_seo_read on public.page_seo for select to anon, authenticated using (true);
drop policy if exists page_seo_admin on public.page_seo;
create policy page_seo_admin on public.page_seo for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists redirects_read on public.redirects;
create policy redirects_read on public.redirects for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists redirects_admin on public.redirects;
create policy redirects_admin on public.redirects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.categories, public.banners, public.book_reviews, public.page_seo, public.redirects to anon;
grant select, insert, update, delete on public.categories, public.banners, public.book_reviews, public.page_seo, public.redirects to authenticated;
grant all on public.categories, public.banners, public.book_reviews, public.page_seo, public.redirects to service_role;

-- -----------------------------------------------------------------------------
-- Storage: a private "media" bucket for banners, category and collection
-- images, preview thumbnails and share images. Served by /api/media/...
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists eboi_storage_admin_select on storage.objects;
create policy eboi_storage_admin_select on storage.objects
  for select to authenticated
  using (bucket_id in ('covers', 'previews', 'media') and public.is_admin());

drop policy if exists eboi_storage_admin_insert on storage.objects;
create policy eboi_storage_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('covers', 'previews', 'media') and public.is_admin());

drop policy if exists eboi_storage_admin_update on storage.objects;
create policy eboi_storage_admin_update on storage.objects
  for update to authenticated
  using (bucket_id in ('covers', 'previews', 'media') and public.is_admin());

drop policy if exists eboi_storage_admin_delete on storage.objects;
create policy eboi_storage_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('covers', 'previews', 'media') and public.is_admin());

-- Covers may also be WebP or GIF now, up to 4 MB.
update storage.buckets
set file_size_limit = 4194304, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'covers';

-- -----------------------------------------------------------------------------
-- Notices and features (Admin > Notices and features)
-- -----------------------------------------------------------------------------
alter table public.site_settings add column if not exists announcement_bg text not null default '#d42d2d';
alter table public.site_settings add column if not exists announcement_fg text not null default '#ffffff';
alter table public.site_settings add column if not exists announcement_image text;
alter table public.site_settings add column if not exists hero_interval integer not null default 5;
alter table public.site_settings add column if not exists popup_enabled boolean not null default false;
alter table public.site_settings add column if not exists popup_title text not null default '';
alter table public.site_settings add column if not exists popup_body text not null default '';
alter table public.site_settings add column if not exists popup_image text;
alter table public.site_settings add column if not exists popup_button_label text not null default '';
alter table public.site_settings add column if not exists popup_link text not null default '';
alter table public.site_settings add column if not exists popup_show_latest boolean not null default true;
alter table public.site_settings add column if not exists popup_delay integer not null default 2;
alter table public.site_settings add column if not exists popup_autoclose integer not null default 0;
alter table public.site_settings add column if not exists popup_frequency text not null default 'session';
alter table public.site_settings add column if not exists popup_version bigint not null default 0;
alter table public.site_settings add column if not exists features jsonb not null default '{}'::jsonb;
alter table public.site_settings add column if not exists trending_searches text[] not null default '{}';

-- Banner slides can show their text on top of the image.
alter table public.banners add column if not exists overlay_text boolean not null default false;

-- -----------------------------------------------------------------------------
-- Visitors outside Bangladesh: dollar prices, dollar payments, abroad message
-- -----------------------------------------------------------------------------
alter table public.books add column if not exists price_usd numeric(10, 2);
alter table public.books drop constraint if exists books_price_usd_check;
alter table public.books add constraint books_price_usd_check check (price_usd is null or price_usd >= 0);
grant select (price_usd) on public.books to anon;

alter table public.site_settings add column if not exists abroad_enabled boolean not null default false;
alter table public.site_settings add column if not exists usd_rate numeric(10, 2) not null default 0;
alter table public.site_settings add column if not exists usd_payment_methods jsonb not null default '[]'::jsonb;
alter table public.site_settings add column if not exists usd_payment_note text not null default '';
alter table public.site_settings add column if not exists whatsapp_abroad_template text not null default '';
alter table public.site_settings add column if not exists whatsapp_abroad_list_template text not null default '';

-- Announcement bar: coupon code, countdown, separate text for visitors abroad.
alter table public.site_settings add column if not exists announcement_code text not null default '';
alter table public.site_settings add column if not exists announcement_ends_at timestamptz;
alter table public.site_settings add column if not exists announcement_abroad text not null default '';

-- Pop-up: new default is first visit, then every 5th visit.
update public.site_settings set popup_frequency = 'visits' where popup_frequency = 'always';

-- -----------------------------------------------------------------------------
-- Free books: always free, or free until a date (then the price comes back)
-- -----------------------------------------------------------------------------
alter table public.books add column if not exists is_free boolean not null default false;
alter table public.books add column if not exists free_until timestamptz;
grant select (is_free, free_until) on public.books to anon;

-- /collections/free is a computed page, so no collection may use that slug.
alter table public.collections drop constraint if exists collections_reserved_slug;
alter table public.collections add constraint collections_reserved_slug
  check (slug not in ('best-selling', 'latest', 'most-viewed', 'free')) not valid;

-- Done.
