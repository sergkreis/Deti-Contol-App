"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/actions/auth";

type PinFormProps = {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  title: string;
  description: string;
  submitLabel: string;
  hiddenFields?: Array<{
    name: string;
    value: string;
  }>;
};

const initialState: AuthState = {};

export function PinForm({
  action,
  title,
  description,
  submitLabel,
  hiddenFields = [],
}: PinFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}

      <div>
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">PIN-код</span>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg tracking-[0.35em] text-slate-950 outline-none ring-0 placeholder:text-slate-300 focus:border-slate-400"
          placeholder="••••"
          required
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Проверяем..." : submitLabel}
      </button>
    </form>
  );
}
