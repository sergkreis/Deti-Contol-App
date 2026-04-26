"use client";

import { useActionState } from "react";
import type { TransactionActionState } from "@/app/actions/transactions";

type TransactionFormProps = {
  action: (
    state: TransactionActionState,
    formData: FormData,
  ) => Promise<TransactionActionState>;
  title: string;
  description: string;
  submitLabel: string;
  children: React.ReactNode;
};

const initialState: TransactionActionState = {};

export function TransactionForm({
  action,
  title,
  description,
  submitLabel,
  children,
}: TransactionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      {children}

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
        {pending ? "Сохраняем..." : submitLabel}
      </button>
    </form>
  );
}
