-- eBoi demo data. Run AFTER supabase/update-01-redesign.sql. Safe to run again.
-- Every statement stands alone, so it works in the Supabase SQL editor.
-- Images are links (Unsplash photos, a Giphy GIF): nothing to upload.
-- Remove later with Admin > Demo data and storage > Delete all demo data.
-- Make sure the columns this demo uses exist (same as update-01, safe to repeat).
alter table public.banners add column if not exists overlay_text boolean not null default false;
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
alter table public.books add column if not exists price_usd numeric(10, 2);
grant select (price_usd) on public.books to anon;
alter table public.site_settings add column if not exists abroad_enabled boolean not null default false;
alter table public.site_settings add column if not exists usd_rate numeric(10, 2) not null default 0;
alter table public.site_settings add column if not exists usd_payment_methods jsonb not null default '[]'::jsonb;
alter table public.site_settings add column if not exists usd_payment_note text not null default '';
alter table public.site_settings add column if not exists whatsapp_abroad_template text not null default '';
alter table public.site_settings add column if not exists whatsapp_abroad_list_template text not null default '';
alter table public.site_settings add column if not exists announcement_code text not null default '';
alter table public.site_settings add column if not exists announcement_ends_at timestamptz;
alter table public.site_settings add column if not exists announcement_abroad text not null default '';

delete from public.events where is_demo;
delete from public.sales_log where is_demo;
delete from public.banners where is_demo;
delete from public.offers where is_demo;
delete from public.collections where is_demo;
delete from public.books where is_demo;
delete from public.categories where is_demo;

insert into public.categories (name, slug, icon, sort_order, show_in_nav, show_on_home, is_demo) values
('Business', 'business', 'business', 1, true, true, true),
('Fiction', 'fiction', 'fiction', 2, true, true, true),
('Programming', 'programming', 'code', 3, true, true, true),
('Language', 'language', 'language', 4, true, true, true),
('Design', 'design', 'design', 5, true, true, true),
('Cooking', 'cooking', 'cooking', 6, false, true, true),
('Kids', 'kids', 'kids', 7, false, true, true),
('Travel', 'travel', 'book', 8, false, true, true),
('Self-help', 'self-help', 'selfhelp', 9, false, true, true)
on conflict do nothing;

update public.categories set image_path = case slug
  when 'fiction' then 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=300&h=300&q=80'
  when 'language' then 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&h=300&q=80'
  when 'kids' then 'https://images.unsplash.com/photo-1513185041617-8ab03f83d6c5?auto=format&fit=crop&w=300&h=300&q=80'
  when 'travel' then 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=300&h=300&q=80'
end
where is_demo and slug in ('fiction', 'language', 'kids', 'travel');

insert into public.collections (id, name, slug, mood, sort_order, show_on_home, show_in_nav, editorial_intro, description, is_demo) values
('c0000000-0000-4000-8000-000000000001', 'Start a side business', 'start-a-side-business', 'forest', 1, true, true,
 'Books for the evening job that might become the day job. Pricing, selling and getting paid, written for Bangladesh.',
 '<p>Every book here assumes a phone, a bKash account and about an hour a night.</p><p>None of them promise passive income. They show you how to charge properly, find the first buyers and keep the paperwork tidy.</p>', true),
('c0000000-0000-4000-8000-000000000002', 'Weekend reads', 'weekend-reads', 'paper', 2, true, true,
 'Novels and stories you can finish between Friday afternoon and Saturday night.', default, true),
('c0000000-0000-4000-8000-000000000003', 'Learn a skill this month', 'learn-a-skill', 'ink', 3, true, false,
 'Practical handbooks with exercises. Thirty minutes a day, one month, one new skill.', default, true),
('c0000000-0000-4000-8000-000000000004', 'বাংলা তাক', 'bangla-shelf', 'paper', 4, true, false,
 'Books written in Bangla, set properly for reading on a phone.', default, true);

update public.collections set image_path = case slug
  when 'start-a-side-business' then 'https://images.unsplash.com/photo-1543248939-4296e1fea89b?auto=format&fit=crop&w=600&h=450&q=80'
  when 'weekend-reads' then 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&w=600&h=450&q=80'
  when 'learn-a-skill' then 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&h=450&q=80'
  when 'bangla-shelf' then 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&h=450&q=80'
end
where is_demo;

insert into public.offers (id, title, banner_text, discount_type, value, applies_to, start_at, end_at, show_countdown, is_active, is_demo) values
('0f000000-0000-4000-8000-000000000001', 'Weekend reads week', 'Every novel and story on the Weekend reads shelf, 20% off until Sunday night.', 'percent', 20, 'collections', now() - interval '2 days', now() + interval '5 days 4 hours', true, true, true),
('0f000000-0000-4000-8000-000000000002', 'Freelance Taka anniversary', 'Fifty taka off the freelancer money book, this month only.', 'fixed', 50, 'books', now() - interval '6 days', now() + interval '12 days', false, true, true),
('0f000000-0000-4000-8000-000000000003', 'Skill month', 'Handbooks with exercises, 15% off for the whole month.', 'percent', 15, 'collections', now() - interval '10 days', now() + interval '20 days', true, true, true),
('0f000000-0000-4000-8000-000000000004', 'Victory Day sale', '10% off every PDF. Scheduled, it starts by itself.', 'percent', 10, 'all', now() + interval '60 days', now() + interval '63 days', true, true, true),
('0f000000-0000-4000-8000-000000000005', 'Last Eid offer', 'Switched off. Kept to show an inactive offer.', 'percent', 25, 'all', now() - interval '150 days', now() - interval '140 days', false, false, true);

insert into public.books (id, title, subtitle, slug, author, category, tags, language, page_count, format, file_size,
  description, highlights, table_of_contents, price, old_price, offer_id, rating, rating_count, total_sells, views,
  release_date, is_featured, status, badge, internal_file_note, is_demo) values
('b0000000-0000-4000-8000-000000000001', 'Notes on Type', 'A working typography handbook for people who make things', 'notes-on-type', 'Arif Rahman', 'Design', array['typography','design','fonts'], 'English', 188, 'PDF', '14.2 MB',
 '<p>Most typography books are written for designers with a semester to spare. This one is for the person who has to make a menu, a CV or a Facebook post look right by this evening.</p><p>It covers choosing two fonts that get along, body text people actually read, spacing, hierarchy and the ten mistakes that make a page look cheap.</p>',
 array['A 188-page PDF with 60 before-and-after examples','A one-page cheat sheet for font pairing and sizes','Notes on setting Bangla and English together'],
 replace('1. Why type matters more than colour|2. Picking two fonts|3. Body text that gets read|4. Hierarchy without shouting|5. Spacing|6. Bangla and English together|7. Ten mistakes, fixed', '|', chr(10)),
 320, null, null, 4.8, 21, 60, 1320, current_date - 4, false, 'published', 'new', 'D:/eboi/books/notes-on-type-FULL.pdf', true),
('b0000000-0000-4000-8000-000000000002', 'Freelance Taka', 'Pricing, invoices and getting paid from abroad', 'freelance-taka', 'Samira Haque', 'Business', array['freelancing','pricing','payments','upwork','fiverr'], 'English', 142, 'PDF', '6.8 MB',
 '<p>You can do the work. The hard part is charging enough for it and getting the money home without losing a fifth on the way.</p><p>This book walks through setting a day rate, writing a quote a client says yes to, invoicing in dollars, and the real costs of each way to receive payment in Bangladesh.</p><h3>Ways to receive money, compared</h3><table><tbody><tr><th>Method</th><th>Speed</th><th>Typical cost</th></tr><tr><td>Bank wire</td><td>2 to 4 days</td><td>Fixed fee plus exchange margin</td></tr><tr><td>Payment platform</td><td>1 to 3 days</td><td>About 2 to 3 percent</td></tr><tr><td>Card withdrawal</td><td>Same day</td><td>Highest</td></tr></tbody></table><p>See <a href="/how-to-order">how to order</a>.</p>',
 array['A pricing worksheet that turns your monthly target into a day rate','Quote and invoice templates you can copy','A plain comparison of ways to receive foreign payments'],
 replace('1. What your time costs|2. Day rates, project rates, retainers|3. The quote that gets a yes|4. Invoices that get paid|5. Receiving money from abroad|6. Tax basics|7. A money routine for uneven months', '|', chr(10)),
 250, null, '0f000000-0000-4000-8000-000000000002', 4.7, 86, 395, 5210, current_date - 120, true, 'published', 'bestseller', 'D:/eboi/books/freelance-taka-FULL.pdf', true),
('b0000000-0000-4000-8000-000000000003', 'নদীর ধারে', 'A novel of one monsoon in Sirajganj', 'nodir-dhare', 'রাফিয়া সুলতানা', 'Fiction', array['bangla novel','river','family'], 'Bangla', 264, 'PDF', '3.1 MB',
 '<p>যমুনার পাড়ে এক বর্ষায় তিন প্রজন্মের এক পরিবারের গল্প। নদী যখন ঘরের দিকে এগিয়ে আসে, তখন কে থাকবে আর কে চলে যাবে, সেই প্রশ্নই এই উপন্যাসের কেন্দ্রে।</p>',
 array['সম্পূর্ণ উপন্যাস, ২৬৪ পৃষ্ঠা','Clean Bangla typesetting, readable on a phone'],
 replace('প্রথম অধ্যায়: জল আসে|দ্বিতীয় অধ্যায়: ঘাটের কথা|তৃতীয় অধ্যায়: নানির বাক্স|চতুর্থ অধ্যায়: চর', '|', chr(10)),
 200, null, null, 4.6, 42, 150, 2890, current_date - 21, false, 'published', 'new', null, true),
('b0000000-0000-4000-8000-000000000004', 'Small Kitchen, Big Rice', 'Forty everyday Bengali rice dishes for one burner', 'small-kitchen-big-rice', 'Nasrin Akter', 'Cooking', array['recipes','rice','bengali food'], 'English', 96, 'PDF', '9.6 MB',
 '<p>Written for hostel rooms, first flats and anyone with one burner and a rice cooker. Khichuri, tehari, polao and fried rice, with shopping lists sized for one or two people.</p>',
 array['40 recipes, each on a single page','Shopping lists for one and for two','A weekly plan that uses up leftovers'],
 replace('1. The rice itself|2. Khichuri, five ways|3. Polao and tehari|4. Fried rice from yesterday|5. A week of meals', '|', chr(10)),
 180, 220, null, 4.5, 33, 115, 1980, current_date - 70, false, 'published', 'none', null, true),
('b0000000-0000-4000-8000-000000000005', 'SQL for Shopkeepers', 'Answer real business questions with one database', 'sql-for-shopkeepers', 'Tanvir Ahmed', 'Programming', array['sql','data','database'], 'English', 210, 'PDF', '5.2 MB',
 '<p>Which product sells on Fridays? Which customers stopped coming back? You do not need a data team to answer that, just one table and twelve queries.</p>',
 array['Twelve queries that answer real questions','Practice data from a made-up Dhaka shop','Works with free tools on any laptop'],
 replace('1. One table is enough|2. Select and filter|3. Counting and grouping|4. Dates and weeks|5. Joining two tables|6. A monthly report in one query', '|', chr(10)),
 350, null, null, 4.4, 19, 190, 3105, current_date - 175, false, 'published', 'none', null, true),
('b0000000-0000-4000-8000-000000000006', 'The Monsoon Notebook', 'Twelve short stories from the city', 'the-monsoon-notebook', 'Imran Kabir', 'Fiction', array['short stories','dhaka'], 'English', 156, 'PDF', '2.4 MB',
 '<p>A rickshaw puller who keeps a diary. A landlord who cannot remember which flat is his. Twelve stories set in one wet season, each short enough for a single cup of tea.</p>',
 array['Twelve stories, 10 to 15 pages each','Readable on a phone in portrait'],
 replace('The Diary|Flat 4B|Load Shedding|The Umbrella Seller|Eight more stories', '|', chr(10)),
 220, null, null, 4.3, 15, 70, 1430, current_date - 88, false, 'published', 'none', null, true),
('b0000000-0000-4000-8000-000000000007', 'IELTS Writing Without Panic', 'Task 2 essays, planned in ten minutes', 'ielts-writing-without-panic', 'Farzana Islam', 'Language', array['ielts','english','writing'], 'English', 120, 'PDF', '3.8 MB',
 '<p>Most Task 2 essays lose marks before the first sentence, in the plan. This book gives you one planning method, twenty question types and a model answer for each.</p>',
 array['One ten-minute planning method','Twenty question types with model answers','A list of phrases examiners are tired of'],
 replace('1. What the examiner is counting|2. The ten-minute plan|3. Opinion essays|4. Discussion essays|5. Twenty model answers', '|', chr(10)),
 280, null, null, 4.9, 128, 520, 6420, current_date - 240, false, 'published', 'bestseller', null, true),
('b0000000-0000-4000-8000-000000000008', 'The First Thousand Customers', 'Selling on Facebook and WhatsApp without ads', 'the-first-thousand-customers', 'Shuvo Das', 'Business', array['f-commerce','facebook','whatsapp'], 'English', 134, 'PDF', '4.5 MB',
 '<p>Paid ads are a tax on not knowing your customers. This book is about the slower, cheaper way: posts people share, replies that close, and a WhatsApp routine that brings buyers back.</p>',
 array['A 30-day posting plan','Reply scripts for the ten most common questions'],
 replace('1. Who buys from a page like yours|2. Posts that get shared|3. The reply that closes|4. WhatsApp as a shop counter', '|', chr(10)),
 300, null, null, 4.5, 27, 90, 2215, current_date - 33, false, 'published', 'none', null, true),
('b0000000-0000-4000-8000-000000000009', 'Excel Without Fear', 'The thirty formulas an office actually uses', 'excel-in-a-weekend', 'Mahmudul Hasan', 'Programming', array['excel','spreadsheets','office'], 'English', 168, 'PDF', '7.1 MB',
 '<p>You do not need all 400 Excel functions. You need about thirty, used well. Each chapter starts from a real office task: a salary sheet, a stock list, a monthly report.</p>',
 array['Thirty formulas, each with a worked office example','A one-page shortcut sheet'],
 replace('1. Tables that do not break|2. SUMIFS and friends|3. Looking things up|4. Pivot tables in ten minutes', '|', chr(10)),
 260, null, null, 4.6, 54, 210, 2980, current_date - 140, false, 'published', 'none', null, true),
('b0000000-0000-4000-8000-000000000010', 'Dhaka on Foot', 'Ten walks through the old city', 'dhaka-on-foot', 'Sabrina Karim', 'Travel', array['dhaka','walking','history'], 'English', 112, 'PDF', '18.4 MB',
 '<p>Ten walks of one to two hours each, from Lalbagh to Sadarghat, with what to look up at, where to eat on the way and when to go.</p>',
 array['Ten routes with hand-drawn maps','Food stops on every walk'],
 replace('1. Lalbagh and around|2. Armanitola|3. Shankhari Bazar|4. Sadarghat at dawn', '|', chr(10)),
 240, null, null, 4.7, 31, 80, 1760, current_date - 12, false, 'published', 'new', null, true),
('b0000000-0000-4000-8000-000000000011', 'ছোটদের বিজ্ঞান খাতা', 'Simple science experiments for ages 8 to 12', 'chotoder-biggan-khata', 'মাহফুজা রহমান', 'Kids', array['science','kids','bangla'], 'Bangla', 72, 'PDF', '11.2 MB',
 '<p>বাড়িতে থাকা জিনিস দিয়ে করা যায় এমন ত্রিশটি সহজ বিজ্ঞান পরীক্ষা, প্রতিটির সাথে সহজ ব্যাখ্যা।</p>',
 array['৩০টি সহজ পরীক্ষা','Print-friendly worksheets'],
 replace('পানি আর তেল|বেলুন রকেট|ছায়ার ঘড়ি', '|', chr(10)),
 150, 180, null, 4.8, 23, 65, 1210, current_date - 48, false, 'published', 'none', null, true),
('b0000000-0000-4000-8000-000000000012', 'Phone Photography for Shops', 'Product photos that sell, shot on any phone', 'phone-photography-for-shops', 'Arif Rahman', 'Design', array['photography','product photos'], 'English', 98, 'PDF', '22.8 MB',
 '<p>Window light, a white sheet and a phone are enough. Set up a corner of a room for product photos and edit them in five minutes without paid apps.</p>',
 array['A corner-studio setup for under 500 taka','A five-minute editing routine'],
 replace('1. Light first|2. The corner studio|3. Angles that sell|4. Editing in five minutes', '|', chr(10)),
 200, null, null, 4.4, 12, 45, 980, current_date - 60, false, 'published', 'none', null, true),
('b0000000-0000-4000-8000-000000000013', 'Habits for Night Owls', 'Doing good work when your best hours are late', 'habits-for-night-owls', 'Nabila Chowdhury', 'Self-help', array['habits','productivity'], 'English', 88, 'PDF', '1.9 MB',
 '<p>A draft. It is not visible on the site until it is published.</p>', array['Draft'], default,
 150, null, null, 0, 0, 0, 0, current_date - 2, false, 'draft', 'none', null, true);

update public.books set cover_alt = title || ' by ' || author || ', book cover' where is_demo;

-- Dollar prices for visitors outside Bangladesh: 200 taka becomes 1.99 dollars.
update public.books set price_usd = ceil(price / 100.0) - 0.01 where is_demo;

-- Slug change: the old link /books/excel-in-a-weekend now redirects to the new one
update public.books set slug = 'excel-without-fear' where id = 'b0000000-0000-4000-8000-000000000009';

insert into public.collection_books (collection_id, book_id, position) values
('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 1),
('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000008', 2),
('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000012', 3),
('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000005', 4),
('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003', 1),
('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000006', 2),
('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004', 3),
('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000010', 4),
('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 1),
('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000007', 2),
('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000009', 3),
('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000005', 4),
('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000003', 1),
('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000011', 2);

insert into public.offer_collections (offer_id, collection_id) values
('0f000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002'),
('0f000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003');
insert into public.offer_books (offer_id, book_id) values
('0f000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002');

insert into public.book_reviews (book_id, author_name, rating, body, review_date, sort_order, is_demo) values
('b0000000-0000-4000-8000-000000000001', 'Nusrat J.', 5, 'Finally a typography book that does not assume I studied design.', current_date - 3, 0, true),
('b0000000-0000-4000-8000-000000000001', 'Tanvir A.', 5, 'I fixed my CV layout the same evening.', current_date - 2, 1, true),
('b0000000-0000-4000-8000-000000000002', 'Mehedi H.', 5, 'The pricing worksheet changed how I quote. I raised my rate and kept every client.', current_date - 40, 0, true),
('b0000000-0000-4000-8000-000000000002', 'Sadia R.', 4, 'Very practical. The invoice templates alone were worth it.', current_date - 22, 1, true),
('b0000000-0000-4000-8000-000000000002', 'Rakib U.', 5, 'Clear comparison of payment options. Saved me money on the first transfer.', current_date - 9, 2, true),
('b0000000-0000-4000-8000-000000000003', 'Farhana K.', 5, 'Beautiful writing. The chapters about the grandmother stayed with me for days.', current_date - 14, 0, true),
('b0000000-0000-4000-8000-000000000004', 'Shirin A.', 5, 'Every recipe works on my single gas burner.', current_date - 30, 0, true),
('b0000000-0000-4000-8000-000000000005', 'Jahid H.', 5, 'I run a small Facebook shop and now I can answer my own sales questions.', current_date - 25, 0, true),
('b0000000-0000-4000-8000-000000000007', 'Ayesha B.', 5, 'Went from 6.0 to 7.0 in Writing. The ten-minute plan really works.', current_date - 35, 0, true),
('b0000000-0000-4000-8000-000000000007', 'Lamia T.', 4, 'Very useful. I would have liked more practice prompts.', current_date - 4, 1, true),
('b0000000-0000-4000-8000-000000000008', 'Nadia P.', 5, 'My first 50 orders came after following the posting plan.', current_date - 20, 0, true),
('b0000000-0000-4000-8000-000000000010', 'Kamrul I.', 5, 'Did the Armanitola walk last Friday. The food stops are spot on.', current_date - 6, 0, true);

-- Hero slides: two photos with text on top, one plain text slide.
insert into public.banners (title, subtitle, button_label, link_url, alt_text, bg_color, text_color, image_desktop_path, image_mobile_path, overlay_text, sort_order, is_demo) values
('Weekend reads, 20% off', 'Novels and short stories you can finish by Saturday night.', 'Shop the offer', '/collections/weekend-reads', 'Open paperback books piled on a table', '#1d5c42', '#ffffff', 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&w=1600&h=500&q=80', 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&w=900&h=600&q=80', true, 1, true),
('Learn a skill this month', 'Handbooks with exercises for SQL, IELTS writing and typography. 15% off.', 'See the books', '/collections/learn-a-skill', 'A library with warm lights', '#18211d', '#ffffff', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&h=500&q=80', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&h=600&q=80', true, 2, true),
('Read the first pages free', 'Every book has a free preview. Order on WhatsApp, pay with bKash or Nagad.', 'How to order', '/how-to-order', 'Read the first pages free', '#18211d', '#ffffff', null, null, false, 3, true);

-- 70 sales over the last 85 days
insert into public.sales_log (book_id, book_title_snapshot, book_code_snapshot, price_snapshot, sold_at, note, is_demo)
select b.id, b.title, b.book_code,
       case when random() < 0.35 then round(b.price * 0.85) else b.price end,
       now() - random() * interval '85 days',
       (array['bKash', 'Nagad', 'bKash, repeat buyer', null])[1 + floor(random() * 4)::int],
       true
from generate_series(1, 70) g
cross join lateral (
  select bk.* from public.books bk
  cross join generate_series(1, greatest(1, bk.total_sells / 25)) w
  where bk.is_demo and bk.status = 'published' and g > 0
  order by random() limit 1
) b;

-- 90 days of visits for the dashboard (one statement, no temp tables)
insert into public.events (type, book_id, section, anon_id, session_id, path, referrer, device, term, result_count, page, dedupe_key, is_demo, created_at)
with demo_visits as materialized (
select d, v,
  'demo' || substr(md5(d || '-' || v || 'a'), 1, 20) as anon_id,
  'demo' || substr(md5(d || '-' || v || 's'), 1, 20) as session_id,
  now() - d * interval '1 day' - random() * interval '20 hours' as at,
  case when random() < 0.78 then 'mobile' when random() < 0.8 then 'desktop' else 'tablet' end as device,
  (array['google.com', 'google.com', 'facebook.com', 'm.facebook.com', null, null])[1 + floor(random() * 6)::int] as referrer
from generate_series(0, 89) d
cross join lateral generate_series(1, greatest(4, round((14 + (89 - d) * 0.35) * (0.8 + random() * 0.4))::int)) v
),
demo_looks as materialized (
select dv.*, bk.id as book_id, bk.slug,
  (array['home_hero', 'home_newest', 'home_best_selling', 'home_latest', 'home_offers', 'collection:weekend-reads', 'shop_results', 'search_suggest'])[1 + floor(random() * 8)::int] as src,
  random() as r1, random() as r2, random() as r3,
  1 + floor(random() * 7)::int as maxp
from demo_visits dv
cross join lateral (
  select b.id, b.slug from public.books b
  cross join generate_series(1, greatest(1, b.views / 400)) w
  where b.is_demo and b.status = 'published' and dv.v > 0
  order by random()
  limit (case when random() < 0.3 then 0 when random() < 0.7 then 1 else 2 end)
) bk
)
select distinct on (session_id, dedupe_key)
  type, book_id, section, anon_id, session_id, path, referrer, device, term, result_count, page, dedupe_key, true, at
from (
  select 'page_view' as type, null::uuid as book_id, null as section, anon_id, session_id, '/' as path, referrer, device, null as term, null::int as result_count, null::int as page, 'page_view|/' as dedupe_key, at from demo_visits
  union all select 'banner_click', null, 'home_hero', anon_id, session_id, '/', referrer, device, null, null, null, 'banner_click|' || (v % 3), at + interval '4 seconds' from demo_visits where random() < 0.07
  union all select 'page_view', null, null, anon_id, session_id, '/shop', referrer, device, null, null, null, 'page_view|/shop', at + interval '20 seconds' from demo_visits where v % 3 = 0
  union all select 'search', null, 'shop_search', anon_id, session_id, '/shop', referrer, device, t.term, t.hits, null, 'search|' || t.term, at + interval '30 seconds'
    from demo_visits
    cross join lateral (
      select * from (values ('ielts', 1), ('freelance', 1), ('sql', 2), ('bangla novel', 2), ('humayun ahmed', 0), ('class 9 math', 0), ('photoshop', 0)) x(term, hits)
      where demo_visits.v > 0 order by random() limit 1
    ) t
    where random() < 0.12
  union all select 'book_click', book_id, src, anon_id, session_id, '/', referrer, device, null, null, null, 'book_click|' || book_id || '|' || src, at + interval '1 minute' from demo_looks
  union all select 'page_view', null, null, anon_id, session_id, '/books/' || slug, referrer, device, null, null, null, 'page_view|/books/' || slug, at + interval '61 seconds' from demo_looks
  union all select 'book_view', book_id, null, anon_id, session_id, '/books/' || slug, referrer, device, null, null, null, 'book_view|' || book_id, at + interval '62 seconds' from demo_looks
  union all select 'preview_open', book_id, 'detail_preview', anon_id, session_id, '/books/' || slug, referrer, device, null, null, null, 'preview_open|' || book_id, at + interval '2 minutes' from demo_looks where r1 < 0.42
  union all select 'preview_page', book_id, 'detail_preview', anon_id, session_id, '/books/' || slug, referrer, device, null, null, p, 'preview_page|' || book_id || '|' || p, at + interval '2 minutes' + p * interval '20 seconds'
    from demo_looks cross join lateral generate_series(1, maxp) p where r1 < 0.42
  union all select 'whatsapp_click', book_id, case when r2 < 0.1 then 'detail_buy_box' when r2 < 0.13 then 'detail_sticky_cta' else 'detail_preview' end, anon_id, session_id, '/books/' || slug, referrer, device, null, null, null, 'whatsapp_click|' || book_id, at + interval '5 minutes' from demo_looks where r2 < 0.16
  union all select 'copy_click', book_id, 'detail_buy_box', anon_id, session_id, '/books/' || slug, referrer, device, null, null, null, 'copy_click|' || book_id, at + interval '310 seconds' from demo_looks where r2 < 0.16 and r3 < 0.55
  union all select 'whatsapp_open', book_id, 'detail_buy_box', anon_id, session_id, '/books/' || slug, referrer, device, null, null, null, 'whatsapp_open|' || book_id, at + interval '320 seconds' from demo_looks where r2 < 0.16 and r3 < 0.75
  union all select 'list_add', book_id, 'detail_buy_box', anon_id, session_id, '/books/' || slug, referrer, device, null, null, null, 'list_add|' || book_id, at + interval '3 minutes' from demo_looks where r3 > 0.92
  union all select 'share_click', book_id, 'detail_buy_box', anon_id, session_id, '/books/' || slug, referrer, device, null, null, null, 'share_click|' || book_id, at + interval '4 minutes' from demo_looks where r1 > 0.97
) e
order by session_id, dedupe_key, at;

-- Turn every storefront feature on: red announcement bar with a GIF,
-- pop-up with the newest books, all home sections, popular searches.
-- Your WhatsApp number and payment numbers are not touched.
update public.site_settings set
  announcement = 'Weekend reads are 20% off until Sunday night
Every book has a free preview. Read before you buy',
  announcement_link = '/collections/weekend-reads',
  announcement_code = 'WEEKEND20',
  announcement_ends_at = date_trunc('week', now()) + interval '6 days 17 hours 59 minutes',
  announcement_abroad = 'Reading from abroad? Prices are in US dollars. Pay with PayPal or Wise',
  abroad_enabled = true,
  usd_rate = 122,
  usd_payment_methods = '[
    {"label": "PayPal", "number": "pay@eboi.example", "note": "Friends and family"},
    {"label": "Wise", "number": "eboi@wise.example", "note": "USD transfer"}
  ]'::jsonb,
  usd_payment_note = 'Send the total in US dollars, then share the receipt in the same WhatsApp chat. We send your PDF right after.',
  whatsapp_abroad_template = '',
  whatsapp_abroad_list_template = '',
  announcement_active = true,
  announcement_dismissible = true,
  announcement_bg = '#d42d2d',
  announcement_fg = '#ffffff',
  announcement_image = 'https://media.giphy.com/media/3o85xBwvWcj1Z11Gda/giphy.gif',
  hero_interval = 5,
  popup_enabled = true,
  popup_title = 'New this week',
  popup_body = 'Fresh PDFs just arrived. Read the first pages free, then order on WhatsApp.',
  popup_image = 'https://media.giphy.com/media/3o85xBwvWcj1Z11Gda/giphy.gif',
  popup_button_label = 'See new arrivals',
  popup_link = '/collections/latest',
  popup_show_latest = true,
  popup_delay = 2,
  popup_autoclose = 15,
  popup_frequency = 'visits',
  popup_version = (extract(epoch from now()) * 1000)::bigint,
  features = '{"sold_count": true, "category_rank": true, "bundle": true, "more_by_author": true, "tag_chips": true, "trending_searches": true, "card_quick_actions": true, "recent_sales_toast": true, "floating_whatsapp": true, "back_to_top": true}'::jsonb,
  trending_searches = array['ielts', 'freelancing', 'bangla novel', 'sql', 'recipes'],
  home_sections = '[
    {"type": "hero", "enabled": true},
    {"type": "trust", "enabled": true},
    {"type": "categories", "enabled": true},
    {"type": "offers", "enabled": true},
    {"type": "newest", "enabled": true},
    {"type": "best_selling", "enabled": true},
    {"type": "latest", "enabled": true},
    {"type": "collections", "enabled": true},
    {"type": "collection_tiles", "enabled": true},
    {"type": "recent", "enabled": true},
    {"type": "stats", "enabled": true},
    {"type": "testimonials", "enabled": true},
    {"type": "journey", "enabled": true},
    {"type": "faq", "enabled": true}
  ]'::jsonb
where id = 1;

select (select count(*) from public.books where is_demo) as books,
       (select count(*) from public.book_reviews where is_demo) as reviews,
       (select count(*) from public.banners where is_demo) as slides,
       (select count(*) from public.sales_log where is_demo) as sales,
       (select count(*) from public.events where is_demo) as events;
