import { Check, Clock3, ImageIcon, ListTodo, ShieldCheck, Users, X } from "lucide-react";
import { logoutParentAction } from "@/app/actions/auth";
import {
  applyQuickCollectiveRuleAction,
  createManualTransactionAction,
  reviewSubmissionAction,
  reviewDishwasherAction,
  reviewRoomAction,
} from "@/app/actions/transactions";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { LogoutButton } from "@/components/logout-button";
import { SectionCard } from "@/components/section-card";
import { Shell } from "@/components/shell";
import { TransactionForm } from "@/components/transaction-form";
import { requireParentSession } from "@/lib/auth";
import { formatDate, formatPoints } from "@/lib/format";
import { getParentPageData } from "@/lib/data";

const actionButtonClass =
  "inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition";

export default async function ParentPage() {
  await requireParentSession();

  const {
    children,
    summary,
    pendingSubmissions,
    tasks,
    transactions,
    collectiveRules,
    responsibilityNotes,
    weeklyReview,
  } = await getParentPageData();

  const tablesRule = collectiveRules[0];

  return (
    <Shell>
      <Header
        variant="parent"
        eyebrow="Родительский режим"
        title="Домашний пульт"
        description="Главный экран для быстрых решений: сначала сегодняшние действия, затем недельная проверка и уже потом история."
        actions={<LogoutButton action={logoutParentAction} label="Выйти" />}
      />

      <main className="grid gap-6 xl:grid-cols-[1.2fr_0.85fr]">
        <div className="grid gap-6">
          <SectionCard
            title="Приоритеты сегодня"
            description="Здесь собраны самые частые действия, которые должны выполняться в одно-два нажатия."
          >
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[26px] bg-amber-50 p-5">
                <div className="flex items-center gap-2 text-amber-700">
                  <Users className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]">Общее правило</p>
                </div>
                <p className="mt-4 text-xl font-semibold text-slate-950">{tablesRule.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{tablesRule.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="success">{formatPoints(tablesRule.rewardPoints)} всем</Badge>
                  <Badge tone="danger">{formatPoints(tablesRule.penaltyPoints)} всем</Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <form
                    action={applyQuickCollectiveRuleAction.bind(
                      null,
                      "/parent",
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
                      "/parent",
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
              </div>

              <TransactionForm
                action={createManualTransactionAction}
                title="Ручное действие"
                description="Когда вы дома и видите результат, можно сразу внести плюс или штраф без фото."
                submitLabel="Сохранить действие"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Ребенок</span>
                    <select
                      name="childId"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-400"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Выберите ребенка
                      </option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Баллы</span>
                    <input
                      name="points"
                      type="number"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-400"
                      placeholder="например, 20 или -30"
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Комментарий</span>
                  <input
                    name="note"
                    type="text"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-400"
                    placeholder="Необязательно, но удобно для истории"
                  />
                </label>
              </TransactionForm>
            </div>
          </SectionCard>

          <SectionCard
            title="Проверка недели"
            description="Второй по важности сценарий после ежедневных действий: комнаты и посудомойка."
          >
            <div className="grid gap-6">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sky-700">
                    <Clock3 className="h-5 w-5" />
                    <p className="font-semibold">Комнаты</p>
                  </div>
                  <Badge>{weeklyReview.room.cycleLabel}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {children.map((child) => (
                    <div key={child.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{child.name}</p>
                        <Badge tone={child.roomReviewed ? "success" : "warning"}>
                          {child.roomReviewed ? "Проверено" : "Ждет проверки"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Еженедельная проверка комнаты по пятницам вечером.
                      </p>
                      <div className="mt-4 grid gap-3">
                        <form action={reviewRoomAction.bind(null, child.id, "reward")}>
                          <button
                            type="submit"
                            disabled={child.roomReviewed}
                            className={`${actionButtonClass} w-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            Принять {formatPoints(weeklyReview.room.rewardPoints)}
                          </button>
                        </form>

                        <form action={reviewRoomAction.bind(null, child.id, "penalty")}>
                          <button
                            type="submit"
                            disabled={child.roomReviewed}
                            className={`${actionButtonClass} w-full bg-rose-600 text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            Штраф {formatPoints(weeklyReview.room.penaltyPoints)}
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] bg-sky-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sky-700">
                    <ShieldCheck className="h-5 w-5" />
                    <p className="font-semibold">Посудомойка недели</p>
                  </div>
                  <Badge>{weeklyReview.dishwasher.cycleLabel}</Badge>
                </div>

                {weeklyReview.dishwasher.currentChild ? (
                  <>
                    <p className="mt-4 text-xl font-semibold text-slate-950">
                      Дежурный: {weeklyReview.dishwasher.currentChild.name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      После итоговой проверки очередь автоматически перейдет следующему ребенку.
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <form action={reviewDishwasherAction.bind(null, "reward")}>
                        <button
                          type="submit"
                          disabled={weeklyReview.dishwasher.alreadyReviewed}
                          className={`${actionButtonClass} w-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          Принять {formatPoints(weeklyReview.dishwasher.rewardPoints)}
                        </button>
                      </form>

                      <form action={reviewDishwasherAction.bind(null, "penalty")}>
                        <button
                          type="submit"
                          disabled={weeklyReview.dishwasher.alreadyReviewed}
                          className={`${actionButtonClass} w-full bg-rose-600 text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          Штраф {formatPoints(weeklyReview.dishwasher.penaltyPoints)}
                        </button>
                      </form>
                    </div>
                    {weeklyReview.dishwasher.alreadyReviewed ? (
                      <p className="mt-3 text-sm font-medium text-emerald-700">
                        Эта неделя уже закрыта, очередь переключена дальше.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <EmptyState
                    title="Дежурный не найден"
                    description="Нужно проверить настройки текущей недели для посудомойки."
                  />
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Очередь фото и удаленная проверка"
            description="Пока это вторичный блок. Он не должен спорить по важности с домашним планшетным сценарием."
            actions={
              <Badge tone={pendingSubmissions.length ? "warning" : "neutral"}>
                {pendingSubmissions.length} заявок
              </Badge>
            }
          >
            {pendingSubmissions.length ? (
              <div className="space-y-3">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-start gap-4">
                      <a
                        href={`/submission-photo/${submission.id}`}
                        className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {submission.photoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/submission-photo/${submission.id}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-7 w-7 text-slate-400" />
                        )}
                      </a>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{submission.task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {submission.child.name} • ожидает подтверждения • {formatDate(submission.submittedAt)}
                        </p>
                        {submission.note ? (
                          <p className="mt-2 text-sm leading-6 text-slate-500">{submission.note}</p>
                        ) : null}
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <form action={reviewSubmissionAction.bind(null, submission.id, "approve")}>
                            <button
                              type="submit"
                              className={`${actionButtonClass} w-full bg-emerald-600 text-white hover:bg-emerald-500`}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Принять {formatPoints(submission.task.points)}
                            </button>
                          </form>

                          <form action={reviewSubmissionAction.bind(null, submission.id, "reject")}>
                            <button
                              type="submit"
                              className={`${actionButtonClass} w-full bg-rose-600 text-white hover:bg-rose-500`}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Отклонить
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Очередь фото пока пустая"
                description="Когда добавим фотоотчеты, здесь появятся заявки детей на проверку."
              />
            )}
          </SectionCard>
        </div>

        <div className="grid gap-6">
          <SectionCard
            title="Счет семьи"
            description="Компактная сводка без отвлечений. Просто общий баланс на текущий момент."
          >
            <div className="grid gap-3">
              {summary.map((child) => (
                <div key={child.id} className="rounded-2xl border border-slate-100 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl" style={{ backgroundColor: child.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{child.name}</p>
                      <p className="text-sm text-slate-500">Текущий счет</p>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">
                      {formatPoints(child.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Последние события"
            description="История ниже по иерархии: она нужна для понимания, но не должна перетягивать внимание с действий."
          >
            <div className="space-y-3">
              {transactions.length ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{transaction.child.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{transaction.title}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-base font-semibold ${
                            transaction.points >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {formatPoints(transaction.points)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    {transaction.note ? (
                      <p className="mt-3 text-sm leading-6 text-slate-500">{transaction.note}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState
                  title="История пока пустая"
                  description="После первых начислений и штрафов здесь появятся последние события."
                />
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Кто отвечает сейчас"
            description="Памятка по закрепленным и ротационным обязанностям."
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
          </SectionCard>

          <SectionCard
            title="Активные задачи"
            description="Справочный список правил и стоимости задач. Это не главный акцент экрана."
            actions={
              <Badge tone="neutral">
                <ListTodo className="mr-1 h-3.5 w-3.5" />
                {tasks.length} задач
              </Badge>
            }
          >
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-2xl bg-slate-50/90 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{task.category}</p>
                    </div>
                    <Badge tone="success">{formatPoints(task.points)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </main>
    </Shell>
  );
}
