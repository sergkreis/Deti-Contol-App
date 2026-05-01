import Link from "next/link";
import { ChevronLeft, LockKeyhole, Shield, Star } from "lucide-react";

type HeaderVariant = "family" | "parent" | "child" | "gate";

type HeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
  variant?: HeaderVariant;
};

const variantClasses: Record<HeaderVariant, string> = {
  family:
    "bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#1f2937_100%)] text-white shadow-[0_30px_70px_-35px_rgba(15,23,42,0.9)]",
  parent:
    "bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#3f3f46_100%)] text-white shadow-[0_30px_70px_-35px_rgba(24,24,27,0.85)]",
  child:
    "bg-[linear-gradient(135deg,#134e4a_0%,#0f766e_45%,#155e75_100%)] text-white shadow-[0_30px_70px_-35px_rgba(19,78,74,0.75)]",
  gate:
    "bg-[linear-gradient(135deg,#312e81_0%,#4338ca_45%,#1d4ed8_100%)] text-white shadow-[0_30px_70px_-35px_rgba(49,46,129,0.72)]",
};

const eyebrowClasses: Record<HeaderVariant, string> = {
  family: "bg-white/10 text-amber-300",
  parent: "bg-white/10 text-amber-200",
  child: "bg-white/10 text-teal-100",
  gate: "bg-white/12 text-indigo-100",
};

const secondaryButtonClasses: Record<HeaderVariant, string> = {
  family: "border-white/15 bg-white/5 hover:bg-white/10",
  parent: "border-white/15 bg-white/5 hover:bg-white/10",
  child: "border-white/15 bg-white/5 hover:bg-white/10",
  gate: "border-white/15 bg-white/10 hover:bg-white/15",
};

export function Header({
  eyebrow,
  title,
  description,
  showBack = false,
  backHref = "/",
  actions,
  variant = "family",
}: HeaderProps) {
  return (
    <header className={`mb-6 rounded-[32px] px-6 py-7 ${variantClasses[variant]}`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${eyebrowClasses[variant]}`}
        >
          <Star className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        {actions ? (
          actions
        ) : showBack ? (
          <Link
            href={backHref}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-white transition ${secondaryButtonClasses[variant]}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Link>
        ) : (
          <Link
            href="/parent/unlock"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-white transition ${secondaryButtonClasses[variant]}`}
          >
            {variant === "gate" ? <LockKeyhole className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            Родительский режим
          </Link>
        )}
      </div>
      <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">{description}</p>
    </header>
  );
}
