import { redirect } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { getAdminUser } from "@/features/admin/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "@/features/admin/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getAdminUser()) redirect("/admin");
  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-green-900 p-10 text-paper md:flex">
        <Wordmark className="w-40 text-paper" />
        <p className="max-w-sm text-headline font-semibold">The back room. Books, offers, sales and numbers.</p>
      </div>
      <div className="flex flex-col justify-center px-5 py-12 md:px-16">
        <Wordmark className="mb-10 w-28 text-green-900 md:hidden" />
        <p className="label text-ink-3">eBoi admin</p>
        <h1 className="mt-2 text-display font-semibold">Sign in</h1>
        {!isSupabaseConfigured ? (
          <p className="mt-6 border-l-4 border-rust bg-rust-wash p-4">Supabase is not configured. Fill in .env first (see README).</p>
        ) : (
          <LoginForm />
        )}
        <p className="mt-8 max-w-sm text-small text-ink-3">
          There is no sign-up. The admin account is created in the Supabase dashboard (README, step 3).
        </p>
      </div>
    </main>
  );
}
