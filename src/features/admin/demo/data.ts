/**
 * Demo catalogue. Every row created from this file is flagged is_demo and is
 * removed (with its storage files) by "Delete all demo data". The books are
 * invented; titles, authors and text are placeholders written for eBoi.
 *
 * Coverage: published + draft, all three badges, featured, manual old price,
 * pinned offer, percent/fixed offers on books/collections/all, a scheduled
 * and an inactive offer, all three collection moods, a Bangla title, a book
 * without a preview, sales history and 90 days of analytics events.
 */

export type CoverStyle = "rule" | "stack" | "split" | "frame" | "grid";

export type DemoBook = {
  key: string;
  title: string;
  /** Latin title for the generated cover (the cover renderer cannot shape Bangla). */
  coverTitle?: string;
  subtitle: string;
  slug: string;
  author: string;
  coverAuthor?: string;
  category: string;
  tags: string[];
  language: string;
  page_count: number;
  file_size: string;
  price: number;
  old_price?: number;
  rating: number;
  rating_count: number;
  total_sells: number;
  views: number;
  daysAgo: number;
  is_featured?: boolean;
  status: "draft" | "published";
  badge: "none" | "new" | "bestseller";
  collections: string[];
  pinnedOffer?: string;
  description: string;
  highlights: string[];
  toc: string;
  previewText: string[];
  noPreview?: boolean;
  cover: { style: CoverStyle; bg: string; fg: string; accent: string };
};

const C = {
  paper: "#f4f0e6",
  ink: "#14201a",
  g950: "#0a1f16",
  g900: "#0f2a1f",
  g700: "#1f4d3a",
  g300: "#94b8a3",
  ochre: "#b8862b",
  rust: "#9a3324",
  slate: "#2f3b3a",
};

export const DEMO_COLLECTIONS = [
  {
    key: "side",
    name: "Start a side business",
    slug: "start-a-side-business",
    mood: "forest" as const,
    sort_order: 1,
    editorial_intro:
      "Books for the evening job that might become the day job. Pricing, selling and getting paid, written for Bangladesh, not for Silicon Valley.",
    description:
      "Every book here assumes a phone, a bKash account and about an hour a night.\n\nNone of them promise passive income. They show you how to charge properly, find the first buyers and keep the paperwork tidy.",
  },
  {
    key: "weekend",
    name: "Weekend reads",
    slug: "weekend-reads",
    mood: "paper" as const,
    sort_order: 2,
    editorial_intro:
      "Novels and stories you can finish between Friday afternoon and Saturday night. No homework, just good sentences.",
    description: "",
  },
  {
    key: "skill",
    name: "Learn a skill this month",
    slug: "learn-a-skill",
    mood: "ink" as const,
    sort_order: 3,
    editorial_intro: "Practical handbooks with exercises. Thirty minutes a day, one month, one new skill.",
    description: "",
  },
];

export const DEMO_BOOKS: DemoBook[] = [
  {
    key: "type",
    title: "Notes on Type",
    subtitle: "A working typography handbook for people who make things",
    slug: "notes-on-type",
    author: "Arif Rahman",
    category: "Design",
    tags: ["typography", "design", "fonts", "layout"],
    language: "English",
    page_count: 188,
    file_size: "14.2 MB",
    price: 320,
    rating: 4.8,
    rating_count: 21,
    total_sells: 64,
    views: 1320,
    daysAgo: 4,
    status: "published",
    badge: "new",
    collections: ["skill"],
    description:
      "Most typography books are written for designers with a semester to spare. This one is written for the person who has to make a menu, a CV or a Facebook post look right by this evening.\n\nIt covers choosing two fonts that get along, setting body text that people actually read, spacing, hierarchy and the ten mistakes that make a page look cheap. Every rule comes with a before and after.",
    highlights: [
      "A 188-page PDF with 60 before-and-after examples",
      "A one-page cheat sheet for font pairing and sizes",
      "Notes on setting Bangla and English on the same page",
    ],
    toc: "1. Why type matters more than colour\n2. Picking two fonts\n3. Body text that gets read\n4. Hierarchy without shouting\n5. Spacing: the invisible part\n6. Bangla and English together\n7. Ten mistakes, fixed\nAppendix: sizes that work",
    previewText: [
      "Open any page you admire and squint. The shapes you still see are hierarchy: one big thing, a few medium things, and a lot of small, even grey. That grey is body text, and most of the work of typography is making it comfortable.",
      "Comfortable means three numbers agree with each other: the size of the letters, the space between lines and the length of a line. Get those right and almost any decent font will look good. Get them wrong and the best font in the world will not save the page.",
      "We will start with line length, because it is the one people ignore. A line of body text should hold somewhere between 55 and 75 characters. Shorter, and the eye jumps too often. Longer, and it loses its place on the way back.",
    ],
    cover: { style: "grid", bg: C.paper, fg: C.ink, accent: C.rust },
  },
  {
    key: "freelance",
    title: "Freelance Taka",
    subtitle: "Pricing, invoices and getting paid from abroad",
    slug: "freelance-taka",
    author: "Samira Haque",
    category: "Business",
    tags: ["freelancing", "pricing", "payments", "upwork", "fiverr"],
    language: "English",
    page_count: 142,
    file_size: "6.8 MB",
    price: 250,
    rating: 4.7,
    rating_count: 86,
    total_sells: 412,
    views: 5210,
    daysAgo: 120,
    is_featured: true,
    status: "published",
    badge: "bestseller",
    collections: ["side"],
    pinnedOffer: "launch",
    description:
      "You can do the work. The hard part is charging enough for it and getting the money home without losing a fifth on the way.\n\nThis book walks through setting a day rate, writing a quote a client says yes to, invoicing in dollars, and the real costs of each way to receive payment in Bangladesh. It ends with a simple monthly money routine for people with irregular income.",
    highlights: [
      "A pricing worksheet that turns your monthly target into a day rate",
      "Quote and invoice templates you can copy",
      "A plain comparison of ways to receive foreign payments",
    ],
    toc: "1. What your time costs\n2. Day rates, project rates, retainers\n3. The quote that gets a yes\n4. Invoices that get paid\n5. Receiving money from abroad\n6. Tax basics for freelancers\n7. A money routine for uneven months",
    previewText: [
      "Start with a number you need, not a number you hope for. Write down what a calm month costs you: rent, food, family, transport, the phone bill, savings. That is your floor. Most freelancers set prices without ever writing this number down, and then wonder why a busy month still feels poor.",
      "Now divide by the days you can really bill. Not thirty. Not even twenty-two. After admin, client calls, revisions and the occasional illness, most solo workers bill fourteen to sixteen days a month. Your day rate is the floor divided by that number, plus a margin for the slow months.",
    ],
    cover: { style: "rule", bg: C.g900, fg: C.paper, accent: C.ochre },
  },
  {
    key: "nodir",
    title: "নদীর ধারে",
    coverTitle: "Nodir Dhare",
    subtitle: "A novel of one monsoon in Sirajganj",
    slug: "nodir-dhare",
    author: "রাফিয়া সুলতানা",
    coverAuthor: "Rafia Sultana",
    category: "Fiction",
    tags: ["bangla novel", "river", "family", "monsoon"],
    language: "Bangla",
    page_count: 264,
    file_size: "3.1 MB",
    price: 200,
    rating: 4.6,
    rating_count: 42,
    total_sells: 156,
    views: 2890,
    daysAgo: 21,
    status: "published",
    badge: "new",
    collections: ["weekend"],
    description:
      "যমুনার পাড়ে এক বর্ষায় তিন প্রজন্মের এক পরিবারের গল্প। নদী যখন ঘরের দিকে এগিয়ে আসে, তখন কে থাকবে আর কে চলে যাবে, সেই প্রশ্নই এই উপন্যাসের কেন্দ্রে।\n\nA family of three generations on the Jamuna, and the one monsoon when the river decides for them. Written in Bangla.",
    highlights: ["সম্পূর্ণ উপন্যাস, ২৬৪ পৃষ্ঠা", "Clean Bangla typesetting, readable on a phone", "Includes a short author's note"],
    toc: "প্রথম অধ্যায়: জল আসে\nদ্বিতীয় অধ্যায়: ঘাটের কথা\nতৃতীয় অধ্যায়: নানির বাক্স\nচতুর্থ অধ্যায়: চর\nপঞ্চম অধ্যায়: ফেরা",
    previewText: [
      "This demo preview uses English placeholder text. The real book is set in Bangla.",
      "The water came the way it always did, first as a rumour and then as a fact. Grandmother said she could smell it two days before anyone saw it, a green smell, like cut grass left in the rain.",
      "By the third morning the path to the school was a canal, and the children went anyway, holding their shoes above their heads like trophies.",
    ],
    cover: { style: "frame", bg: C.g700, fg: C.paper, accent: C.g300 },
  },
  {
    key: "kitchen",
    title: "Small Kitchen, Big Rice",
    subtitle: "Forty everyday Bengali rice dishes for one burner",
    slug: "small-kitchen-big-rice",
    author: "Nasrin Akter",
    category: "Cooking",
    tags: ["recipes", "rice", "bengali food", "student"],
    language: "English",
    page_count: 96,
    file_size: "9.6 MB",
    price: 180,
    old_price: 220,
    rating: 4.5,
    rating_count: 33,
    total_sells: 121,
    views: 1980,
    daysAgo: 70,
    status: "published",
    badge: "none",
    collections: ["weekend"],
    description:
      "Written for hostel rooms, first flats and anyone with one burner and a rice cooker. Khichuri, tehari, polao and fried rice, with shopping lists sized for one or two people.",
    highlights: ["40 recipes, each on a single page", "Shopping lists for one and for two", "A weekly plan that uses up leftovers"],
    toc: "1. The rice itself\n2. Khichuri, five ways\n3. Polao and tehari\n4. Fried rice from yesterday\n5. Sweet rice\n6. A week of meals",
    previewText: [
      "Wash the rice until the water runs nearly clear, then stop. Over-washing strips the starch that makes khichuri creamy. Three rinses is usually right.",
      "For one person, use half a cup of rice and a quarter cup of moong dal. Toast the dal in a dry pan until it smells like biscuits. This one step is the difference between a hospital khichuri and a Friday one.",
    ],
    cover: { style: "split", bg: C.ochre, fg: C.g950, accent: C.paper },
  },
  {
    key: "sql",
    title: "SQL for Shopkeepers",
    subtitle: "Answer real business questions with one database",
    slug: "sql-for-shopkeepers",
    author: "Tanvir Ahmed",
    category: "Programming",
    tags: ["sql", "data", "database", "small business"],
    language: "English",
    page_count: 210,
    file_size: "5.2 MB",
    price: 350,
    rating: 4.4,
    rating_count: 19,
    total_sells: 198,
    views: 3105,
    daysAgo: 175,
    status: "published",
    badge: "none",
    collections: ["skill"],
    description:
      "Which product sells on Fridays? Which customers stopped coming back? You do not need a data team to answer that, just one table and twelve queries. This book teaches SQL through the questions a shop owner actually asks.",
    highlights: ["Twelve queries that answer real questions", "Practice data from a made-up Dhaka shop", "Works with free tools on any laptop"],
    toc: "1. One table is enough\n2. SELECT and WHERE\n3. Counting and grouping\n4. Dates and weeks\n5. Joining two tables\n6. Customers who left\n7. A monthly report in one query",
    previewText: [
      "A database is a set of tables, and a table is a spreadsheet that refuses to let you be sloppy. Every row is one thing, every column is one fact about it, and every fact has a type.",
      "Our first question: how many orders did we take last Friday? In SQL that is one line, and by the end of this chapter you will read it as easily as a sentence.",
    ],
    cover: { style: "stack", bg: C.slate, fg: C.paper, accent: C.ochre },
  },
  {
    key: "monsoon",
    title: "The Monsoon Notebook",
    subtitle: "Twelve short stories from the city",
    slug: "the-monsoon-notebook",
    author: "Imran Kabir",
    category: "Fiction",
    tags: ["short stories", "dhaka", "literary"],
    language: "English",
    page_count: 156,
    file_size: "2.4 MB",
    price: 220,
    rating: 4.3,
    rating_count: 15,
    total_sells: 74,
    views: 1430,
    daysAgo: 88,
    status: "published",
    badge: "none",
    collections: ["weekend"],
    description:
      "A rickshaw puller who keeps a diary. A landlord who cannot remember which flat is his. Twelve stories set in one wet season, each short enough for a single cup of tea.",
    highlights: ["Twelve stories, 10 to 15 pages each", "Readable on a phone in portrait", "An afterword on writing about Dhaka"],
    toc: "The Diary\nFlat 4B\nLoad Shedding\nThe Umbrella Seller\nWaterlogged\nSeven more stories",
    previewText: [
      "Karim bought the notebook on the day the rains began, because the man at the stall said a notebook was a kind of umbrella for thoughts. Karim did not understand this, but he liked the man, and the notebook was only twenty taka.",
      "He wrote the first entry at a red light on Mirpur Road. It said: rain. The second entry, two lights later, said: more rain.",
    ],
    cover: { style: "rule", bg: C.paper, fg: C.g900, accent: C.g700 },
  },
  {
    key: "ielts",
    title: "IELTS Writing Without Panic",
    subtitle: "Task 2 essays, planned in ten minutes",
    slug: "ielts-writing-without-panic",
    author: "Farzana Islam",
    category: "Language",
    tags: ["ielts", "english", "writing", "exam"],
    language: "English",
    page_count: 120,
    file_size: "3.8 MB",
    price: 280,
    rating: 4.9,
    rating_count: 128,
    total_sells: 540,
    views: 6420,
    daysAgo: 240,
    status: "published",
    badge: "bestseller",
    collections: ["skill"],
    description:
      "Most Task 2 essays lose marks before the first sentence, in the plan. This book gives you one planning method, twenty question types and a model answer for each, with notes on why it scores what it scores.",
    highlights: ["One ten-minute planning method", "Twenty question types with model answers", "A list of phrases examiners are tired of"],
    toc: "1. What the examiner is counting\n2. The ten-minute plan\n3. Opinion essays\n4. Discussion essays\n5. Problem and solution\n6. Twenty model answers",
    previewText: [
      "Read the question twice and underline the task, not the topic. 'Discuss both views and give your opinion' is three jobs, and an essay that does two of them very well still loses marks.",
      "Now write four lines, and only four: your answer in one sentence, two reasons, and one example for each reason. That is the plan. It takes ten minutes the first week and four minutes by the third.",
    ],
    cover: { style: "grid", bg: C.g900, fg: C.paper, accent: C.ochre },
  },
  {
    key: "customers",
    title: "The First Thousand Customers",
    subtitle: "Selling on Facebook and WhatsApp without ads",
    slug: "the-first-thousand-customers",
    author: "Shuvo Das",
    category: "Business",
    tags: ["f-commerce", "facebook", "whatsapp", "marketing"],
    language: "English",
    page_count: 134,
    file_size: "4.5 MB",
    price: 300,
    rating: 4.5,
    rating_count: 27,
    total_sells: 96,
    views: 2215,
    daysAgo: 33,
    status: "published",
    badge: "none",
    collections: ["side"],
    description:
      "Paid ads are a tax on not knowing your customers. This book is about the slower, cheaper way: posts people share, replies that close, and a WhatsApp routine that turns one buyer into three.",
    highlights: ["A 30-day posting plan", "Reply scripts for the ten most common questions", "How to ask for a review without being awkward"],
    toc: "1. Who buys from a page like yours\n2. Posts that get shared\n3. The reply that closes\n4. WhatsApp as a shop counter\n5. Reviews and repeat buyers",
    previewText: [
      "Your first hundred customers will come from people who already know your name. That is not a weakness; it is the only honest start. The question is how to make each of them bring two more.",
      "Begin with a list. Not a spreadsheet of leads: a list of thirty real people who might need what you sell, with one sentence each about why.",
    ],
    cover: { style: "stack", bg: C.rust, fg: C.paper, accent: C.paper },
  },
  {
    key: "owls",
    title: "Habits for Night Owls",
    subtitle: "Doing good work when your best hours are late",
    slug: "habits-for-night-owls",
    author: "Nabila Chowdhury",
    category: "Self-help",
    tags: ["habits", "productivity", "sleep"],
    language: "English",
    page_count: 88,
    file_size: "1.9 MB",
    price: 150,
    rating: 0,
    rating_count: 0,
    total_sells: 0,
    views: 0,
    daysAgo: 2,
    status: "draft",
    badge: "none",
    collections: [],
    description: "A draft: not visible on the site until it is published.",
    highlights: [],
    toc: "",
    previewText: ["Draft preview text."],
    cover: { style: "frame", bg: C.ink, fg: C.paper, accent: C.ochre },
  },
  {
    key: "lettering",
    title: "Hand Lettering Drills",
    subtitle: "Thirty pages of practice sheets",
    slug: "hand-lettering-drills",
    author: "Arif Rahman",
    category: "Design",
    tags: ["lettering", "practice"],
    language: "English",
    page_count: 30,
    file_size: "12 MB",
    price: 120,
    rating: 0,
    rating_count: 0,
    total_sells: 0,
    views: 0,
    daysAgo: 1,
    status: "draft",
    badge: "none",
    collections: [],
    description: "A draft without a preview, to show how the admin flags missing files.",
    highlights: [],
    toc: "",
    previewText: [],
    noPreview: true,
    cover: { style: "split", bg: C.paper, fg: C.ink, accent: C.ochre },
  },
];

export const DEMO_OFFERS = [
  {
    key: "weekend",
    title: "Weekend reads week",
    banner_text: "Every novel and story on the Weekend reads shelf, 20% off until Sunday night.",
    discount_type: "percent" as const,
    value: 20,
    applies_to: "collections" as const,
    collections: ["weekend"],
    books: [] as string[],
    startDaysAgo: 2,
    endInHours: 5 * 24 + 4,
    show_countdown: true,
    is_active: true,
  },
  {
    key: "launch",
    title: "Freelance Taka anniversary",
    banner_text: "Fifty taka off the freelancer's money book, this month only.",
    discount_type: "fixed" as const,
    value: 50,
    applies_to: "books" as const,
    collections: [] as string[],
    books: ["freelance"],
    startDaysAgo: 6,
    endInHours: 12 * 24,
    show_countdown: false,
    is_active: true,
  },
  {
    key: "skill",
    title: "Skill month",
    banner_text: "Handbooks with exercises, 15% off for the whole month.",
    discount_type: "percent" as const,
    value: 15,
    applies_to: "collections" as const,
    collections: ["skill"],
    books: [] as string[],
    startDaysAgo: 10,
    endInHours: 20 * 24,
    show_countdown: false,
    is_active: true,
  },
  {
    key: "victory",
    title: "Victory Day sale",
    banner_text: "10% off every PDF. Scheduled: it starts by itself.",
    discount_type: "percent" as const,
    value: 10,
    applies_to: "all" as const,
    collections: [] as string[],
    books: [] as string[],
    startDaysAgo: -60,
    endInHours: 63 * 24,
    show_countdown: true,
    is_active: true,
  },
  {
    key: "eid",
    title: "Last Eid offer",
    banner_text: "Switched off. Kept to show an inactive offer.",
    discount_type: "percent" as const,
    value: 25,
    applies_to: "all" as const,
    collections: [] as string[],
    books: [] as string[],
    startDaysAgo: 150,
    endInHours: -140 * 24,
    show_countdown: false,
    is_active: false,
  },
];

export const DEMO_SEARCHES = [
  { term: "ielts", hits: true },
  { term: "freelance", hits: true },
  { term: "sql", hits: true },
  { term: "recipe", hits: true },
  { term: "bangla novel", hits: true },
  { term: "humayun ahmed", hits: false },
  { term: "class 9 math", hits: false },
  { term: "rich dad poor dad", hits: false },
  { term: "photoshop", hits: false },
];

/** Categories with icons. Only names missing from the list are added (and removed again with the demo). */
export const DEMO_CATEGORIES = [
  { name: "Business", slug: "business", icon: "business", show_in_nav: true },
  { name: "Fiction", slug: "fiction", icon: "fiction", show_in_nav: true },
  { name: "Programming", slug: "programming", icon: "code", show_in_nav: true },
  { name: "Language", slug: "language", icon: "language", show_in_nav: true },
  { name: "Design", slug: "design", icon: "design", show_in_nav: true },
  { name: "Cooking", slug: "cooking", icon: "cooking", show_in_nav: false },
  { name: "Self-help", slug: "self-help", icon: "selfhelp", show_in_nav: false },
];

/**
 * Hero slides. Two are generated images (desktop and phone versions, with
 * real demo covers on them); the third is a plain text slide, so both kinds
 * are on show.
 */
export type DemoBanner = {
  key: string;
  title: string;
  subtitle: string;
  button_label: string;
  link_url: string;
  alt_text: string;
  bg_color: string;
  text_color: string;
  /** Demo book keys whose covers are drawn on the image. Empty = text slide. */
  covers: string[];
};

export const DEMO_BANNERS: DemoBanner[] = [
  {
    key: "weekend",
    title: "Weekend reads, 20% off",
    subtitle: "Novels and short stories you can finish by Saturday night.",
    button_label: "Shop the offer",
    link_url: "/collections/weekend-reads",
    alt_text: "Weekend reads, 20% off novels and short stories",
    bg_color: "#1d5c42",
    text_color: "#ffffff",
    covers: ["nodir", "monsoon", "kitchen"],
  },
  {
    key: "skill",
    title: "Learn a skill this month",
    subtitle: "Handbooks with exercises: SQL, IELTS writing and typography.",
    button_label: "See the books",
    link_url: "/collections/learn-a-skill",
    alt_text: "Learn a skill this month: SQL, IELTS writing and typography handbooks",
    bg_color: "#f3efe4",
    text_color: "#18211d",
    covers: ["sql", "ielts", "type"],
  },
  {
    key: "preview",
    title: "Read the first pages free",
    subtitle: "Every book has a free preview. Order on WhatsApp and pay with bKash or Nagad.",
    button_label: "How to order",
    link_url: "/how-to-order",
    alt_text: "",
    bg_color: "#18211d",
    text_color: "#ffffff",
    covers: [],
  },
];

/** Extra HTML appended to a demo description, to show rich text (tables, lists, links). */
export const DEMO_DESCRIPTION_EXTRA: Record<string, string> = {
  freelance:
    "<h3>Ways to receive money, compared</h3><table><tbody><tr><th>Method</th><th>Speed</th><th>Typical cost</th></tr><tr><td>Bank wire</td><td>2–4 days</td><td>Fixed fee plus exchange margin</td></tr><tr><td>Payment platform to local bank</td><td>1–3 days</td><td>About 2–3%</td></tr><tr><td>Card withdrawal</td><td>Same day</td><td>Highest</td></tr></tbody></table><p>The book explains each one step by step. See <a href=\"/how-to-order\">how to order</a> to get your copy today.</p>",
  sql: "<h3>What you will be able to answer</h3><ul><li>Which products sold best last month</li><li>Who your repeat customers are</li><li>Which day of the week brings the most orders</li></ul>",
  ielts: "<p><strong>Who it is for:</strong> candidates aiming for band 6.5 to 7.5 in Writing Task 2.</p>",
};

/** Customer reviews shown on the book page: [name, rating, text, days ago]. */
export const DEMO_REVIEWS: Record<string, [string, number, string, number][]> = {
  type: [
    ["Nusrat J.", 5, "Finally a typography book that does not assume I studied design. The before-and-after pages are the best part.", 3],
    ["Tanvir A.", 5, "I fixed my CV layout the same evening. The font pairing cheat sheet is now on my desk.", 2],
  ],
  freelance: [
    ["Mehedi H.", 5, "The pricing worksheet changed how I quote. I raised my rate and kept every client.", 40],
    ["Sadia R.", 4, "Very practical. I wish the tax chapter were longer, but the invoice templates alone were worth it.", 22],
    ["Rakib U.", 5, "Clear comparison of payment options. Saved me real money on the first transfer.", 9],
  ],
  nodir: [
    ["Farhana K.", 5, "Beautiful writing. The grandmother's chapters stayed with me for days.", 14],
    ["Imran S.", 4, "A slow, gentle novel. Perfect for a rainy weekend.", 6],
  ],
  kitchen: [
    ["Shirin A.", 5, "Every recipe works on my single gas burner. The khichuri chapter is a family favourite now.", 30],
    ["Arif M.", 4, "Simple, honest food. Good for students living alone.", 12],
  ],
  sql: [
    ["Jahid H.", 5, "I run a small Facebook shop and now I can answer my own sales questions. Exercises are excellent.", 25],
    ["Priya D.", 4, "Starts gently and builds up well. The last two chapters need a second read.", 8],
  ],
  monsoon: [["Kamrul I.", 4, "Short, sharp stories. The one about the night bus is my favourite.", 18]],
  ielts: [
    ["Ayesha B.", 5, "Went from 6.0 to 7.0 in Writing. The ten-minute planning method really works.", 35],
    ["Shafin R.", 5, "The model essays are realistic, not perfect, which made them easier to learn from.", 16],
    ["Lamia T.", 4, "Very useful. I would have liked more practice prompts.", 4],
  ],
  customers: [
    ["Nadia P.", 5, "Real advice for selling on WhatsApp without ads. My first 50 orders came from chapter three.", 20],
    ["Sabbir K.", 4, "Good scripts for replying to customers. A bit repetitive in the middle.", 11],
  ],
};
