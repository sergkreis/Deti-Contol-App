import Link from "next/link";
import { ArrowRight, Camera, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { Badge } from "@/components/badge";
import { Header } from "@/components/header";
import { SectionCard } from "@/components/section-card";
import { Shell } from "@/components/shell";
import { getDashboardData } from "@/lib/data";

export default async function Home() {
  const { children, pendingCount } = await getDashboardData();

  return (
    <Shell>
      <Header
        eyebrow="Deti Control"
        title="Домашние дела, фотоотчеты и семейные баллы в одном месте."
        description="Теперь вход защищен PIN-кодами: у родителя отдельный доступ, а каждый ребенок видит только свой кабинет."
      />

      <main className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/child/${child.slug}/unlock`}
              className="group rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.45)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-slate-950"
                  style={{ backgroundColor: child.color }}
                >
                  {child.name.charAt(0)}
                </div>
                <Badge tone="neutral">Личный вход</Badge>
              </div>
              <div className="mt-6">
                <p className="text-2xl font-semibold text-slate-950">{child.name}</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Открыть только свой кабинет, ввести PIN и посмотреть свои задания и баллы.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Защита</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">Детский PIN-код</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>

        <div className="grid gap-6">
          <SectionCard
            title="Как работает MVP"
            description="Сейчас уже заложен основной семейный поток, без лишней сложности."
          >
            <div className="grid gap-3">
              {[
                {
                  icon: LockKeyhole,
                  title: "У каждого свой PIN",
                  text: "Ребенок входит только в свой профиль, а родительская панель закрыта отдельным кодом.",
                },
                {
                  icon: Camera,
                  title: "Ребенок отправляет фото",
                  text: "Выбирает задание, делает фото и отправляет заявку на проверку.",
                },
                {
                  icon: Clock3,
                  title: "Заявка ждет решения",
                  text: "Фото хранится только временно, пока родитель не примет решение.",
                },
                {
                  icon: Sparkles,
                  title: "Баллы начисляются после проверки",
                  text: "После одобрения или отклонения фото должно удаляться, а история остается.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
                  <item.icon className="h-5 w-5 text-amber-500" />
                  <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Родительская очередь"
            description="Родительский режим открывается только по отдельному PIN-коду."
            actions={<Badge tone={pendingCount > 0 ? "warning" : "success"}>{pendingCount} новых</Badge>}
          >
            <p className="text-sm leading-6 text-slate-600">
              Уже подготовлен экран родителя с очередью фотоотчетов, последними событиями и списком активных заданий.
            </p>
            <Link
              href="/parent/unlock"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Открыть панель родителя
              <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionCard>
        </div>
      </main>
    </Shell>
  );
}
