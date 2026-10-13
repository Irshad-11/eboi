import type { ReactNode } from "react";
import { requireAdminPage } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";

/** Every admin page sits behind this server-side admin check. */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminPage();
  return <AdminShell email={user.email}>{children}</AdminShell>;
}
