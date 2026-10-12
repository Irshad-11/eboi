import type { ReactNode } from "react";
import { Breadcrumbs } from "@/features/seo/breadcrumbs";

/** Header for the text pages: breadcrumb, kicker, very large title, short lead. */
export function PageHeader({
  kicker,
  title,
  lead,
  path,
  crumb,
}: {
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  path: string;
  crumb: string;
}) {
  return (
    <header className="container-x pt-6 pb-10 md:pb-16">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: crumb, path }]} />
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="label text-ink-3">{kicker}</p>
          <h1 className="mt-3 text-mega font-semibold">{title}</h1>
        </div>
        {lead && <div className="text-lead text-ink-2 lg:col-span-4 lg:self-end">{lead}</div>}
      </div>
    </header>
  );
}
