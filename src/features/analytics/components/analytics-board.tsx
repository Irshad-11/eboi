import { formatNumber, formatPrice } from "@/lib/format";
import type { getAnalytics } from "../queries";
import { StatTile } from "./stat-tile";
import { LineChart } from "./line-chart";
import { BarList } from "./bar-list";
import { Funnel } from "./funnel";

type Data = Awaited<ReturnType<typeof getAnalytics>>;

/** Shared by the overview dashboard and the per-book page. */
export function AnalyticsBoard({ data, perBook = false }: { data: Data; perBook?: boolean }) {
  const c = data.current;
  const p = data.previous;
  const tiles: [string, number, number, string?][] = [
    [perBook ? "Unique visitors" : "Visitors", c.visitors, p.visitors],
    [perBook ? "Page views" : "Book views", c.book_views, p.book_views],
    ["Preview opens", c.preview_opens, p.preview_opens],
    ["WhatsApp taps", c.whatsapp_clicks, p.whatsapp_clicks],
    ["Sales", c.sales, p.sales],
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-px border-2 border-ink bg-ink md:grid-cols-3 xl:grid-cols-6">
        {tiles.map(([label, cur, prev]) => (
          <StatTile key={label} label={label} value={formatNumber(cur)} current={cur} previous={prev} />
        ))}
        <StatTile label="Revenue" value={formatPrice(c.revenue)} current={c.revenue} previous={p.revenue} />
      </div>
      <p className="micro -mt-5 text-ink-3">
        Also: {formatNumber(c.copy_clicks)} message copies · {formatNumber(c.whatsapp_opens)} opened WhatsApp · {formatNumber(c.list_adds)} added to My List
        {!perBook && ` · ${formatNumber(c.page_views)} page views · ${formatNumber(c.searches)} searches`}
      </p>

      <div className="grid gap-px border-2 border-ink bg-ink md:grid-cols-2">
        <LineChart
          title={perBook ? "Views per day" : "Visitors per day"}
          points={data.daily.map((d) => ({ label: d.label, value: perBook ? d.book_views : d.visitors }))}
          summary={perBook ? "total" : "average"}
        />
        <LineChart title="WhatsApp taps per day" points={data.daily.map((d) => ({ label: d.label, value: d.whatsapp_clicks }))} />
        <LineChart title="Preview opens per day" points={data.daily.map((d) => ({ label: d.label, value: d.preview_opens }))} />
        <LineChart title="Revenue per day" points={data.daily.map((d) => ({ label: d.label, value: d.revenue }))} kind="money" />
      </div>

      <div className="grid gap-px border-2 border-ink bg-ink lg:grid-cols-2">
        <Funnel
          steps={[
            { label: "Viewed a book", value: data.funnel.viewed },
            { label: "Opened preview", value: data.funnel.previewed },
            { label: "Tapped WhatsApp", value: data.funnel.clicked },
            { label: "Bought", value: data.funnel.sold },
          ]}
          note={`Sessions per step; sales come from the sales log.${data.funnel.avgPreviewPage ? ` Readers reach page ${data.funnel.avgPreviewPage} of the preview on average.` : ""}`}
        />
        <BarList title="Which sections drive clicks" items={data.sections} />
      </div>

      <div className="grid gap-px border-2 border-ink bg-ink md:grid-cols-2 xl:grid-cols-3">
        <BarList title="Where visitors come from" items={data.referrers} />
        <BarList title="Devices" items={data.devices} />
        {!perBook && <BarList title="Most viewed pages" items={data.paths} />}
      </div>
    </div>
  );
}
