import "server-only";
import { RANGES, sectionLabel, type RangeDays } from "@/config/analytics";
import { SITE } from "@/config/site";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Admin analytics. All aggregation happens in SQL functions
 * (supabase/schema.sql); this file only shapes their rows for the UI.
 */

export function parseRange(value: string | undefined): RangeDays {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

export function periodBounds(days: number, now = new Date()) {
  const to = now;
  const from = new Date(to.getTime() - days * 86400000);
  const prevFrom = new Date(from.getTime() - days * 86400000);
  return { from: from.toISOString(), to: to.toISOString(), prevFrom: prevFrom.toISOString(), prevTo: from.toISOString() };
}

const num = (v: unknown) => Number(v ?? 0);

const EMPTY_SUMMARY = {
  visitors: 0,
  page_views: 0,
  book_views: 0,
  preview_opens: 0,
  whatsapp_clicks: 0,
  whatsapp_opens: 0,
  copy_clicks: 0,
  list_adds: 0,
  searches: 0,
  sales: 0,
  revenue: 0,
};
export type Summary = typeof EMPTY_SUMMARY;

function toSummary(row: Record<string, unknown> | undefined): Summary {
  if (!row) return { ...EMPTY_SUMMARY };
  return Object.fromEntries(Object.keys(EMPTY_SUMMARY).map((k) => [k, num(row[k])])) as Summary;
}

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export async function getAnalytics(days: RangeDays, bookId: string | null = null) {
  const supabase = await createSessionClient();
  const { from, to, prevFrom, prevTo } = periodBounds(days);
  const p_book = bookId;
  const [cur, prev, daily, funnel, referrers, devices, sections, paths] = await Promise.all([
    supabase.rpc("analytics_summary", { p_from: from, p_to: to, p_book }),
    supabase.rpc("analytics_summary", { p_from: prevFrom, p_to: prevTo, p_book }),
    supabase.rpc("analytics_daily", { p_from: from, p_to: to, p_book, p_tz: SITE.timezone }),
    supabase.rpc("analytics_funnel", { p_from: from, p_to: to, p_book }),
    supabase.rpc("analytics_breakdown", { p_from: from, p_to: to, p_dimension: "referrer", p_book, p_limit: 8 }),
    supabase.rpc("analytics_breakdown", { p_from: from, p_to: to, p_dimension: "device", p_book, p_limit: 4 }),
    supabase.rpc("analytics_breakdown", { p_from: from, p_to: to, p_dimension: "section", p_book, p_limit: 10 }),
    bookId ? Promise.resolve({ data: [], error: null }) : supabase.rpc("analytics_breakdown", { p_from: from, p_to: to, p_dimension: "path", p_limit: 8 }),
  ]);
  const firstError = [cur, prev, daily, funnel, referrers, devices, sections, paths].find((r) => r.error)?.error;
  if (firstError) throw new Error(`Analytics query failed: ${firstError.message}`);

  const f = funnel.data?.[0];
  const list = (rows: { label: string; value: number }[] | null) => (rows ?? []).map((r) => ({ label: r.label, value: num(r.value) }));
  return {
    days,
    current: toSummary(cur.data?.[0]),
    previous: toSummary(prev.data?.[0]),
    daily: (daily.data ?? []).map((d) => ({
      // Dates arrive as "YYYY-MM-DD"; slice guards against a full timestamp.
      label: dayLabel.format(new Date(`${String(d.day).slice(0, 10)}T00:00:00Z`)),
      visitors: num(d.visitors),
      book_views: num(d.book_views),
      preview_opens: num(d.preview_opens),
      whatsapp_clicks: num(d.whatsapp_clicks),
      sales: num(d.sales),
      revenue: num(d.revenue),
    })),
    funnel: {
      viewed: num(f?.viewed),
      previewed: num(f?.previewed),
      clicked: num(f?.clicked),
      sold: num(f?.sold),
      avgPreviewPage: f?.avg_preview_page != null ? num(f.avg_preview_page) : null,
    },
    referrers: list(referrers.data),
    devices: list(devices.data),
    sections: list(sections.data).map((r) => ({ ...r, label: sectionLabel(r.label) })),
    paths: list(paths.data),
  };
}

export async function getTopBooks(days: RangeDays) {
  const supabase = await createSessionClient();
  const { from, to } = periodBounds(days);
  const { data, error } = await supabase.rpc("analytics_top_books", { p_from: from, p_to: to, p_limit: 10 });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, views: num(r.views), preview_opens: num(r.preview_opens), whatsapp_clicks: num(r.whatsapp_clicks), sales: num(r.sales), revenue: num(r.revenue) }));
}

export async function getSearchTerms(days: RangeDays) {
  const supabase = await createSessionClient();
  const { from, to } = periodBounds(days);
  const { data, error } = await supabase.rpc("analytics_search_terms", { p_from: from, p_to: to, p_limit: 100 });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, searches: num(r.searches), zero_result_searches: num(r.zero_result_searches) }));
}
