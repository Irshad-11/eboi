import { redirect } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { getAdminUser, getSessionUser } from "@/features/admin/auth";
import { LoginForm } from "@/features/admin/login-form";
import { signOut } from "@/features/admin/actions/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getAdminUser()) redirect("/admin");
  const session = await getSessionUser();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8">
        <Wordmark className="h-7 w-auto text-brand-ink" />
        <h1 className="mt-5 text-xl font-semibold">Admin sign in</h1>
        {session ? (
          <div className="mt-5 space-y-3">
            <p role="alert" className="rounded-md border border-warn/30 bg-warn-soft px-3 py-2.5 text-sm text-warn">
              Signed in as {session.email}, but this account is not an admin.
            </p>
            <form action={signOut}>
              <button className="btn btn-secondary btn-block">Sign out</button>
            </form>
          </div>
        ) : (
          <LoginForm />
        )}
      </div>
    </main>
  );
}
