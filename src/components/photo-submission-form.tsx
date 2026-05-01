"use client";

import { useActionState } from "react";
import { Camera, Plus } from "lucide-react";
import type { TransactionActionState } from "@/app/actions/transactions";

type PhotoSubmissionFormProps = {
  action: (
    state: TransactionActionState,
    formData: FormData,
  ) => Promise<TransactionActionState>;
};

const initialState: TransactionActionState = {};

export function PhotoSubmissionForm({ action }: PhotoSubmissionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-3">
      <label className="block">
        <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Camera className="h-4 w-4" />
          Фото
        </span>
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-800"
          required
        />
      </label>

      <input
        name="note"
        type="text"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-400"
        placeholder="Комментарий, если нужен"
      />

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {pending ? "Отправляем..." : "Отправить фото"}
      </button>
    </form>
  );
}
