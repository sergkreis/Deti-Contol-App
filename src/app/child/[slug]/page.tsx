import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, ChevronLeft, CircleAlert, Plus, ShieldCheck } from "lucide-react";
import { logoutChildAction } from "@/app/actions/auth";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { LogoutButton } from "@/components/logout-button";
import { SectionCard } from "@/components/section-card";
import { Shell } from "@/components/shell";
import { getChildPageData } from "@/lib/data";
import { requireChildSession } from "@/lib/auth";
import { formatDate, formatPoints } from "@/lib/format";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ChildPage({ params }: PageProps) {
  const { slug } = await params;
  await requireChildSession(slug);
  const data = await getChildPageData(slug);

  if (!data) {
    notFound();
  }

  const { child, tasks } = data;

  return (
    <Shell>
      <Header
        variant="child"
        eyebrow={`Профиль ${child.name}`}
        title={`${child.name}, здесь твои задачи и текущий счет`}
        description="Личный кабинет ребенка показывает баллы, доступные дела и статус последних отправок."
        showBack
        actions={<LogoutButton action={logoutChildAction} label="Выйти" />}
      />

      <main className="grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
        <div className="grid gap-6">
          <SectionCard title="Баланс" description="Очки обновляются после решения родителя.">
            <div
              className="rounded-[28px] p-5 text-slate-950"
              style={{ background: `linear-gradient(135deg, ${child.color}, #ffffff)` }}
            >
              <p className="text-sm uppercase tracking-[0.2em] text-slate-700">Текущий счет</p>
              <p className="mt-3 text-5xl font-semibold">{formatPoints(child.balance)}</p>
              <p className="mt-3 text-sm text-slate-700">
                Следующий шаг в развитии кабинета — фотоотчет с телефона и отправка на
                проверку.
              </p>
            </div>
            <Link
              href="#tasks"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Camera className="h-4 w-4" />
              Посмотреть задания
            </Link>
          </SectionCard>

          <SectionCard
            title="Последние заявки"
            description="Здесь видно, что уже было отправлено на проверку."
          >
            <div className="space-y-3">
              {child.submissions.length ? (
                child.submissions.map((submission) => (
                  <div key={submission.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{submission.task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(submission.submittedAt)}</p>
                      </div>
                      <Badge
                        tone={
                          submission.status === "APPROVED"
                            ? "success"
                            : submission.status === "REJECTED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {submission.status === "APPROVED"
                          ? "Одобрено"
                          : submission.status === "REJECTED"
                            ? "Отклонено"
                            : "На проверке"}
                      </Badge>
                    </div>
                    {submission.note ? (
                      <p className="mt-3 text-sm leading-6 text-slate-500">{submission.note}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Пока нет отправленных заданий"
                  description="Когда появятся фотоотчеты, здесь будет виден их статус."
                />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6">
          <SectionCard
            title="Доступные задания"
            description="Первая версия уже показывает реальные домашние дела вашей семьи."
          >
            <div id="tasks" className="grid gap-3 sm:grid-cols-2">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge>{task.category}</Badge>
                    <p className="text-lg font-semibold text-emerald-600">{formatPoints(task.points)}</p>
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900">{task.title}</p>
                  {task.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">{task.description}</p>
                  ) : null}
                  <button
                    type="button"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-100"
                  >
                    <Plus className="h-4 w-4" />
                    Скоро: отправить фото
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Что будет дальше"
            description="Следующий слой разработки уже понятен и будет строиться поверх этого кабинета."
          >
            <div className="grid gap-3">
              <div className="rounded-2xl bg-amber-50 p-4">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                <p className="mt-3 font-semibold text-slate-900">Фото и подтверждение</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Добавим загрузку фото с телефона и очередь на одобрение в родительской панели.
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <CircleAlert className="h-5 w-5 text-rose-600" />
                <p className="mt-3 font-semibold text-slate-900">Штрафы и бонусы</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Родитель сможет вручную добавлять плюс или минус с коротким комментарием.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
              >
                <ChevronLeft className="h-4 w-4" />
                Вернуться на главную
              </Link>
            </div>
          </SectionCard>
        </div>
      </main>
    </Shell>
  );
}
