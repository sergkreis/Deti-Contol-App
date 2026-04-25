import { CheckCircle2, Clock3, ListChecks, Shield, XCircle } from "lucide-react";
import { logoutParentAction } from "@/app/actions/auth";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { LogoutButton } from "@/components/logout-button";
import { SectionCard } from "@/components/section-card";
import { Shell } from "@/components/shell";
import { requireParentSession } from "@/lib/auth";
import { formatDate, formatPoints } from "@/lib/format";
import { getParentPageData } from "@/lib/data";

export default async function ParentPage() {
  await requireParentSession();
  const { summary, pendingSubmissions, tasks, transactions } = await getParentPageData();

  return (
    <Shell>
      <Header
        eyebrow="Родительский режим"
        title="Очередь фотоотчетов и общий контроль по всем детям."
        description="Это рабочая панель родителя: кто сколько набрал, какие задания активны и какие заявки ждут решения."
        showBack
        actions={<LogoutButton action={logoutParentAction} label="Выйти" />}
      />

      <main className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <SectionCard
            title="Ждут проверки"
            description="После одобрения или отклонения фото в финальной логике будет удаляться."
            actions={
              <Badge tone={pendingSubmissions.length ? "warning" : "success"}>
                {pendingSubmissions.length} в очереди
              </Badge>
            }
          >
            <div className="space-y-4">
              {pendingSubmissions.length ? (
                pendingSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{submission.task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {submission.child.name} • {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      <Badge tone="warning">На проверке</Badge>
                    </div>
                    <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                      <p className="text-sm font-medium text-slate-600">Здесь будет фотоотчет</p>
                      <p className="mt-2 text-xs text-slate-400">{submission.photoPath}</p>
                    </div>
                    {submission.note ? (
                      <p className="mt-4 text-sm leading-6 text-slate-500">{submission.note}</p>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Скоро: одобрить
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500"
                      >
                        <XCircle className="h-4 w-4" />
                        Скоро: отклонить
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Очередь пустая"
                  description="Когда дети отправят фотоотчеты, они появятся здесь на проверке."
                />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Последние события" description="История начислений, штрафов и решений.">
            <div className="space-y-3">
              {transactions.map((transaction) => (
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
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6">
          <SectionCard title="Общий счет" description="Сводка по всем детям на текущий момент.">
            <div className="space-y-3">
              {summary.map((child) => (
                <div key={child.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl" style={{ backgroundColor: child.color }} />
                      <p className="font-semibold text-slate-900">{child.name}</p>
                    </div>
                    <p className="text-xl font-semibold text-slate-900">{formatPoints(child.balance)}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Активные задания" description="Их родитель сможет менять в следующем шаге.">
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

          <SectionCard title="Следующие блоки" description="Что логично реализовать после каркаса.">
            <div className="grid gap-3">
              {[
                {
                  icon: Shield,
                  title: "PIN-вход родителя",
                  text: "Панель уже закрыта PIN-кодом и не открывается детям напрямую.",
                },
                {
                  icon: Clock3,
                  title: "Временное хранение фото",
                  text: "Фото будет жить только до решения и удаляться сразу после него.",
                },
                {
                  icon: ListChecks,
                  title: "Ручные бонусы и штрафы",
                  text: "Добавим форму, где можно быстро дать плюс или минус с причиной.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl bg-slate-50/90 p-4">
                  <item.icon className="h-5 w-5 text-slate-600" />
                  <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </main>
    </Shell>
  );
}
