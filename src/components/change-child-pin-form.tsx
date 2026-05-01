"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import type { ChildPinState } from "@/app/actions/auth";

type ChangeChildPinFormProps = {
  action: (state: ChildPinState, formData: FormData) => Promise<ChildPinState>;
};

const initialState: ChildPinState = {};

export function ChangeChildPinForm({ action }: ChangeChildPinFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-slate-900">
          <KeyRound className="h-5 w-5" />
          <p className="text-lg font-semibold">Сменить PIN</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Новый PIN будет использоваться при следующем входе в этот детский кабинет.
        </p>
      </div>

      <div className="grid gap-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Текущий PIN</span>
          <input
            name="currentPin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg tracking-[0.35em] text-slate-950 outline-none focus:border-slate-400"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Новый PIN</span>
          <input
            name="newPin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="new-password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg tracking-[0.35em] text-slate-950 outline-none focus:border-slate-400"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Повторите PIN</span>
          <input
            name="confirmPin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="new-password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg tracking-[0.35em] text-slate-950 outline-none focus:border-slate-400"
            required
          />
        </label>
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Сохраняем..." : "Сохранить PIN"}
      </button>
    </form>
  );
}
