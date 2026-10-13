"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: null, email: "" });
  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      {state.error && (
        <div role="alert" className="rounded-md border border-sale/30 bg-sale-soft px-3 py-2.5 text-sm break-words text-sale">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} className="input" aria-invalid={Boolean(state.error) || undefined} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <button className="btn btn-primary btn-block" data-loading={pending} disabled={pending}>
        Sign in
      </button>
    </form>
  );
}
