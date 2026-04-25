import Link from "next/link";
import { Shield, Star } from "lucide-react";

type HeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
};

export function Header({
  eyebrow,
  title,
  description,
  showBack = false,
  backHref = "/",
  actions,
}: HeaderProps) {
  return (
    <header className="mb-6 rounded-[32px] bg-slate-950 px-6 py-7 text-white shadow-[0_30px_70px_-35px_rgba(15,23,42,0.9)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
          <Star className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        {actions ? (
          actions
        ) : showBack ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Назад
          </Link>
        ) : (
          <Link
            href="/parent/unlock"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Shield className="h-4 w-4" />
            Родительский режим
          </Link>
        )}
      </div>
      <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{description}</p>
    </header>
  );
}
