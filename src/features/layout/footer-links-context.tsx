"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FooterColumn } from "@/features/settings/schema";

/** Footer link columns, reused as page links inside the mobile drawer. */
const Ctx = createContext<FooterColumn[]>([]);

export function FooterLinksProvider({ columns, children }: { columns: FooterColumn[]; children: ReactNode }) {
  return <Ctx.Provider value={columns}>{children}</Ctx.Provider>;
}

export function useFooterLinks() {
  return useContext(Ctx);
}
