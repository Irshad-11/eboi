"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FooterColumn, NavLink } from "@/features/settings/schema";
import { saveNavigation } from "../actions/settings";
import { AdminCard } from "./admin-page-head";
import { ListEditor } from "./list-editor";
import { Notice } from "./notice";

type Props = { header: NavLink[]; footer: FooterColumn[]; social: NavLink[] };

function LinkRow({ link, upd, i, prefix }: { link: NavLink; upd: (p: Partial<NavLink>) => void; i: number; prefix: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input aria-label={`${prefix} ${i + 1} label`} placeholder="Label" className="input" value={link.label} onChange={(e) => upd({ label: e.target.value })} />
      <input aria-label={`${prefix} ${i + 1} link`} placeholder="/shop or https://…" className="input" value={link.url} onChange={(e) => upd({ url: e.target.value })} />
    </div>
  );
}

/** Header menu extras, footer columns and social links. */
export function NavigationForm(props: Props) {
  const router = useRouter();
  const [header, setHeader] = useState(props.header);
  const [footer, setFooter] = useState(props.footer);
  const [social, setSocial] = useState(props.social);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveNavigation({ header_links: header, footer_columns: footer, social_links: social });
          const detail = !res.ok && res.fieldErrors ? ` ${Object.values(res.fieldErrors)[0] ?? ""}` : "";
          setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error + detail });
          if (res.ok) router.refresh();
        });
      }}
    >
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <AdminCard title="Menu links" description="Added after the categories and collections in the menu bar.">
        <ListEditor<NavLink> items={header} onChange={setHeader} blank={() => ({ label: "", url: "" })} addLabel="Add link" max={8} render={(l, upd, i) => <LinkRow link={l} upd={upd} i={i} prefix="Menu link" />} />
      </AdminCard>
      <AdminCard title="Footer columns" description="A Categories column is added automatically.">
        <ListEditor<FooterColumn>
          items={footer}
          onChange={setFooter}
          blank={() => ({ title: "", links: [] })}
          addLabel="Add column"
          max={5}
          render={(col, upd, i) => (
            <div className="space-y-2">
              <input aria-label={`Column ${i + 1} title`} placeholder="Column title" className="input font-semibold" value={col.title} onChange={(e) => upd({ title: e.target.value })} />
              <ListEditor<NavLink> items={col.links} onChange={(links) => upd({ links })} blank={() => ({ label: "", url: "" })} addLabel="Add link" max={10} render={(l, u, j) => <LinkRow link={l} upd={u} i={j} prefix={`Column ${i + 1} link`} />} />
            </div>
          )}
        />
      </AdminCard>
      <AdminCard title="Social links" description="Footer, and the Organization data Google reads.">
        <ListEditor<NavLink> items={social} onChange={setSocial} blank={() => ({ label: "", url: "" })} addLabel="Add social link" max={8} render={(l, upd, i) => <LinkRow link={l} upd={upd} i={i} prefix="Social link" />} />
      </AdminCard>
      <button className="btn btn-primary" data-loading={pending} disabled={pending}>
        Save menus and footer
      </button>
    </form>
  );
}
