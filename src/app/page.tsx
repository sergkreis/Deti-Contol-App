import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BellDot,
  ClipboardList,
  LockKeyhole,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { applyQuickCollectiveRuleAction } from "@/app/actions/transactions";
import { Badge } from "@/components/badge";
import { Header } from "@/components/header";
import { SectionCard } from "@/components/section-card";
import { Shell } from "@/components/shell";
import { formatDate, formatPoints } from "@/lib/format";
import { getDashboardData } from "@/lib/data";

const actionButtonClass =
  "inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition";

export default async function Home() {
  await connection();

  const {
    children,
    pendingCount,
    parentUnlocked,
    collectiveRules,
    weeklyFocus,
    responsibilityNotes,
    recentTransactions,
  } = await getDashboardData();

  const tablesRule = collectiveRules[0];
  const roomFocus = weeklyFocus.find((item) => item.id === "room-review");
  const dishwasherFocus = weeklyFocus.find((item) => item.id === "dishwasher-rotation");

  return (
    <Shell>
      <Header
        variant="family"
        eyebrow="Deti Control"
        title="Семейная доска"
        description="Домашний экран для планшета: сразу видно баланс, дежурства, очередь на проверку и самые частые действия."
      />

      <main className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
          <SectionCard
            title="Семья сегодня"
            description="Главный обзор без лишнего шума: кто как идет, у кого есть заявки и что важно по неделе."
            actions={<Badge tone="warning">{pendingCount} ждут проверки</Badge>}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-slate-950"
                      style={{ backgroundColor: child.color }}
                    >
                      {child.name.charAt(0)}
                    </div>
                    <Badge tone={child.pendingCount > 0 ? "warning" : "success"}>
                      {child.pendingCount > 0 ? `${child.pendingCount} заявок` : "Все спокойно"}
                    </Badge>
                  </div>

                  <p className="mt-6 text-2xl font-semibold text-slate-950">{child.name}</p>
                  <p className="mt-2 text-sm text-slate-500">Текущий счет</p>
                  <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">
                    {formatPoints(child.balance)}
                  </p>

                  <div className="mt-5 space-y-2">
                    {child.statuses.map((status) => (
                      <div key={status} className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-600">
                        {status}
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/child/${child.slug}/unlock`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950"
                  >
                    Личный вход
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  Очередь
                </p>
                <p className="mt-3 text-3xl font-semibold">{pendingCount}</p>
                <p className="mt-2 text-sm text-white/70">Столько фото и задач ждут подтверждения.</p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Посудомойка
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {dishwasherFocus && "currentOwnerName" in dishwasherFocus
                    ? dishwasherFocus.currentOwnerName
                    : "Не назначен"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {dishwasherFocus?.cycleLabel ?? "Неделя не определена"}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Комнаты
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{roomFocus?.cycleLabel ?? "Без срока"}</p>
                <p className="mt-2 text-sm text-slate-500">Недельная проверка и закрытие цикла.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Что важно сейчас"
            description="Главная зона действий для планшета: сначала то, что нужно решить сегодня, затем недельный фокус."
          >
            <div className="grid gap-4">
              <div className="rounded-[26px] bg-amber-50 p-5">
                <div className="flex items-center gap-2 text-amber-700">
                  <Users className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]">Сегодня</p>
                </div>
                <p className="mt-4 text-xl font-semibold text-slate-950">{tablesRule.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{tablesRule.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="success">{formatPoints(tablesRule.rewardPoints)} всем</Badge>
                  <Badge tone="danger">{formatPoints(tablesRule.penaltyPoints)} всем</Badge>
                </div>

                {parentUnlocked ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <form
                      action={applyQuickCollectiveRuleAction.bind(
                        null,
                        "/",
                        tablesRule.title,
                        tablesRule.rewardPoints,
                        "Порядок на столах к возвращению родителя.",
                      )}
                    >
                      <button
                        type="submit"
                        className={`${actionButtonClass} w-full bg-emerald-600 text-white hover:bg-emerald-500`}
                      >
                        Всем {formatPoints(tablesRule.rewardPoints)}
                      </button>
                    </form>

                    <form
                      action={applyQuickCollectiveRuleAction.bind(
                        null,
                        "/",
                        tablesRule.title,
                        tablesRule.penaltyPoints,
                        "На столах остался беспорядок к возвращению родителя.",
                      )}
                    >
                      <button
                        type="submit"
                        className={`${actionButtonClass} w-full bg-rose-600 text-white hover:bg-rose-500`}
                      >
                        Всем {formatPoints(tablesRule.penaltyPoints)}
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link
                    href="/parent/unlock"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Shield className="h-4 w-4" />
                    Открыть родительский режим
                  </Link>
                )}
              </div>

              <div className="rounded-[26px] bg-sky-50 p-5">
                <div className="flex items-center gap-2 text-sky-700">
                  <ClipboardList className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]">На этой неделе</p>
                </div>

                <div className="mt-4 space-y-3">
                  {weeklyFocus.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white/80 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <Badge>{item.cycleLabel}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                      {"currentOwnerName" in item ? (
                        <p className="mt-2 text-sm font-medium text-slate-700">
                          Дежурный сейчас: {item.currentOwnerName}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard
            title="Кто за что отвечает"
            description="Домашняя памятка без лишней бюрократии: видно роли, но любую задачу можно подхватить."
          >
            <div className="space-y-3">
              {responsibilityNotes.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <Badge>{item.owner}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/parent/unlock"
                className="flex items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white hover:bg-slate-800"
              >
                <div>
                  <p className="font-semibold">Родительский режим</p>
                  <p className="mt-1 text-sm text-slate-300">Начислить, проверить неделю и открыть историю.</p>
                </div>
                <Shield className="h-5 w-5" />
              </Link>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <LockKeyhole className="h-5 w-5" />
                  <p className="font-semibold">Детские входы</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Каждый ребенок заходит только в свой кабинет через личный PIN-код.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Последние события"
            description="Короткая лента без перегруза: только последние изменения, чтобы быстро понять, что уже внесено."
            actions={
              pendingCount > 0 ? (
                <Badge tone="warning">
                  <BellDot className="mr-1 h-3.5 w-3.5" />
                  Есть очередь
                </Badge>
              ) : null
            }
          >
            <div className="grid gap-3 lg:grid-cols-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.child.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{transaction.title}</p>
                    </div>
                    <p
                      className={`text-base font-semibold ${
                        transaction.points >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {formatPoints(transaction.points)}
                    </p>
                  </div>
                  {transaction.note ? (
                    <p className="mt-3 text-sm leading-6 text-slate-500">{transaction.note}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-slate-400">{formatDate(transaction.createdAt)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-semibold text-slate-900">Следующий слой продукта</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Фотоотчеты и удаленная модерация будут строиться поверх этой домашней версии, не ломая планшетный сценарий.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </main>
    </Shell>
  );
}
