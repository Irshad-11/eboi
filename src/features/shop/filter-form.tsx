import Link from "next/link";
import { SORTS, type ShopParams } from "@/features/books/catalog";

type Props = {
  idPrefix: string;
  params: ShopParams;
  categories: [string, number][];
  languages: [string, number][];
  minPrice: number;
  maxPrice: number;
  symbol: string;
};

/**
 * Plain GET form: filters work without JavaScript and every result page has
 * a shareable URL. Used in the desktop sidebar and the mobile sheet.
 */
export function FilterForm({ idPrefix, params, categories, languages, minPrice, maxPrice, symbol }: Props) {
  const id = (s: string) => `${idPrefix}${s}`;
  return (
    <form action="/shop" method="get" className="space-y-6">
      {params.q && <input type="hidden" name="q" value={params.q} />}
      {params.offer && <input type="hidden" name="offer" value={params.offer} />}

      <div>
        <label htmlFor={id("sort")} className="field-label">
          Sort
        </label>
        <select id={id("sort")} name="sort" defaultValue={params.sort ?? "newest"} className="select">
          {Object.entries(SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="field-label">Category</legend>
        <div className="space-y-0.5">
          <Radio name="category" id={id("cat-all")} value="" checked={!params.category} label="All categories" />
          {categories.map(([c, n]) => (
            <Radio key={c} name="category" id={id(`cat-${c}`)} value={c} checked={params.category === c} label={c} count={n} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">Language</legend>
        <div className="space-y-0.5">
          <Radio name="language" id={id("lang-all")} value="" checked={!params.language} label="Any language" />
          {languages.map(([l, n]) => (
            <Radio key={l} name="language" id={id(`lang-${l}`)} value={l} checked={params.language === l} label={l} count={n} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">Price ({symbol})</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={id("min")} className="sr-only">
              Minimum price
            </label>
            <input id={id("min")} name="min" type="number" inputMode="numeric" min={0} placeholder={`From ${minPrice}`} defaultValue={params.min ?? ""} className="input input-mono" />
          </div>
          <div>
            <label htmlFor={id("max")} className="sr-only">
              Maximum price
            </label>
            <input id={id("max")} name="max" type="number" inputMode="numeric" min={0} placeholder={`To ${maxPrice}`} defaultValue={params.max ?? ""} className="input input-mono" />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-4 border-t-[3px] border-ink pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          Apply
        </button>
        <Link href={params.q ? `/shop?q=${encodeURIComponent(params.q)}` : "/shop"} className="btn btn-quiet">
          Clear
        </Link>
      </div>
    </form>
  );
}

function Radio(props: { name: string; id: string; value: string; checked: boolean; label: string; count?: number }) {
  return (
    <label htmlFor={props.id} className="flex min-h-11 cursor-pointer items-center gap-3 hover:bg-paper-2 md:min-h-10">
      <input type="radio" id={props.id} name={props.name} value={props.value} defaultChecked={props.checked} className="check" />
      <span className="flex-1">{props.label}</span>
      {props.count != null && <span className="micro text-ink-3 tnum">{props.count}</span>}
    </label>
  );
}
