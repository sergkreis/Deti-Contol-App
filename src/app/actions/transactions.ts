"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasChildSession, hasParentSession } from "@/lib/auth";
import {
  getCurrentDishwasherCycleKey,
  getCurrentRoomCycleKey,
  getNextDishwasherSlug,
  householdSettingKeys,
  setHouseholdSetting,
  weeklyRules,
} from "@/lib/household";
import { deleteSubmissionPhoto, saveSubmissionPhoto } from "@/lib/submission-photos";

export type TransactionActionState = {
  error?: string;
  success?: string;
};

const initialState: TransactionActionState = {};

function normalizePoints(rawValue: FormDataEntryValue | null) {
  const parsed = Number(String(rawValue ?? "").trim());

  if (!Number.isFinite(parsed) || parsed === 0) {
    return null;
  }

  return Math.trunc(parsed);
}

async function requireParentAccess() {
  if (!(await hasParentSession())) {
    redirect("/parent/unlock");
  }
}

async function requireChildAccess(slug: string) {
  if (!(await hasChildSession(slug))) {
    redirect(`/child/${slug}/unlock`);
  }
}

function refreshScreens() {
  revalidatePath("/");
  revalidatePath("/parent");
  revalidatePath("/child/[slug]", "page");
}

export async function createSubmissionAction(
  childSlug: string,
  taskId: string,
  prevState: TransactionActionState = initialState,
  formData: FormData,
): Promise<TransactionActionState> {
  void prevState;
  await requireChildAccess(childSlug);

  const note = String(formData.get("note") ?? "").trim();
  const photo = formData.get("photo");

  if (!(photo instanceof File)) {
    return { error: "Выберите фото для отправки." };
  }

  const [child, task] = await Promise.all([
    prisma.child.findUnique({
      where: { slug: childSlug },
      select: { id: true, slug: true },
    }),
    prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, isActive: true },
    }),
  ]);

  if (!child || !task?.isActive) {
    return { error: "Задача больше недоступна." };
  }

  let photoPath: string;

  try {
    photoPath = await saveSubmissionPhoto(photo, child.slug);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Не удалось сохранить фото.",
    };
  }

  try {
    await prisma.submission.create({
      data: {
        childId: child.id,
        taskId: task.id,
        photoPath,
        note: note || null,
      },
    });
  } catch {
    await deleteSubmissionPhoto(photoPath);
    return { error: "Не удалось отправить фото. Попробуйте еще раз." };
  }

  refreshScreens();
  redirect(`/child/${child.slug}`);
}

export async function reviewSubmissionAction(
  submissionId: string,
  outcome: "approve" | "reject",
) {
  await requireParentAccess();

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      task: true,
      child: {
        select: { id: true, slug: true },
      },
    },
  });

  if (!submission || submission.status !== "PENDING") {
    redirect("/parent");
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: {
        status: outcome === "approve" ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
      },
    });

    await tx.transaction.create({
      data: {
        childId: submission.childId,
        submissionId: submission.id,
        title: submission.task.title,
        note:
          outcome === "approve"
            ? "Фотоотчет принят родителем."
            : "Фотоотчет отклонен родителем.",
        points: outcome === "approve" ? submission.task.points : 0,
        type: outcome === "approve" ? "REWARD" : "REJECTION",
      },
    });
  });

  await deleteSubmissionPhoto(submission.photoPath);
  refreshScreens();
  redirect("/parent");
}

export async function createManualTransactionAction(
  prevState: TransactionActionState = initialState,
  formData: FormData,
): Promise<TransactionActionState> {
  void prevState;
  await requireParentAccess();

  const childId = String(formData.get("childId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const points = normalizePoints(formData.get("points"));

  if (!childId) {
    return { error: "Выберите ребенка." };
  }

  if (points === null) {
    return { error: "Укажите количество баллов. Можно ставить плюс или минус." };
  }

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { id: true, name: true },
  });

  if (!child) {
    return { error: "Ребенок не найден." };
  }

  await prisma.transaction.create({
    data: {
      childId: child.id,
      title: points > 0 ? "Ручное начисление" : "Ручной штраф",
      note: note || null,
      points,
      type: points > 0 ? "MANUAL_BONUS" : "MANUAL_PENALTY",
    },
  });

  refreshScreens();

  return {
    success: `${child.name}: ${points > 0 ? "+" : ""}${points} сохранено.`,
  };
}

export async function createCollectiveTransactionAction(
  prevState: TransactionActionState = initialState,
  formData: FormData,
): Promise<TransactionActionState> {
  void prevState;
  await requireParentAccess();

  const title = String(formData.get("title") ?? "").trim() || "Коллективное правило";
  const note = String(formData.get("note") ?? "").trim();
  const points = normalizePoints(formData.get("points"));

  if (points === null) {
    return { error: "Для коллективного действия нужно указать баллы." };
  }

  const children = await prisma.child.findMany({
    where: { isActive: true },
    select: { id: true },
    orderBy: { name: "asc" },
  });

  if (children.length === 0) {
    return { error: "Нет активных детей для начисления." };
  }

  await prisma.transaction.createMany({
    data: children.map((child) => ({
      childId: child.id,
      title,
      note: note || null,
      points,
      type: points > 0 ? "MANUAL_BONUS" : "MANUAL_PENALTY",
    })),
  });

  refreshScreens();

  return {
    success: `Коллективное действие применено ко всем детям: ${points > 0 ? "+" : ""}${points}.`,
  };
}

export async function applyQuickCollectiveRuleAction(
  returnPath: string,
  title: string,
  points: number,
  note: string,
) {
  await requireParentAccess();

  const children = await prisma.child.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  if (children.length > 0) {
    await prisma.transaction.createMany({
      data: children.map((child) => ({
        childId: child.id,
        title,
        note,
        points,
        type: points > 0 ? "MANUAL_BONUS" : "MANUAL_PENALTY",
      })),
    });
  }

  refreshScreens();
  redirect(returnPath);
}

export async function reviewRoomAction(childId: string, outcome: "reward" | "penalty") {
  await requireParentAccess();

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { id: true, name: true, slug: true },
  });

  if (!child) {
    redirect("/parent");
  }

  const cycleKey = getCurrentRoomCycleKey();
  const roomSettingKey = householdSettingKeys.roomLastReviewed(child.slug);
  const existingReview = await prisma.setting.findUnique({
    where: { key: roomSettingKey },
  });

  if (existingReview?.value === cycleKey) {
    redirect("/parent");
  }

  await prisma.transaction.create({
    data: {
      childId: child.id,
      title: weeklyRules.room.title,
      note:
        outcome === "reward"
          ? `Недельная проверка комнаты завершена успешно (${cycleKey}).`
          : `Недельная проверка комнаты не пройдена (${cycleKey}).`,
      points: outcome === "reward" ? weeklyRules.room.rewardPoints : weeklyRules.room.penaltyPoints,
      type: outcome === "reward" ? "MANUAL_BONUS" : "MANUAL_PENALTY",
    },
  });

  await setHouseholdSetting(roomSettingKey, cycleKey);

  refreshScreens();
  redirect("/parent");
}

export async function reviewDishwasherAction(outcome: "reward" | "penalty") {
  await requireParentAccess();

  const cycleKey = getCurrentDishwasherCycleKey();
  const [dishwasherSetting, reviewedSetting] = await Promise.all([
    prisma.setting.findUnique({
      where: { key: householdSettingKeys.dishwasherCurrentSlug },
    }),
    prisma.setting.findUnique({
      where: { key: householdSettingKeys.dishwasherLastReviewedCycle },
    }),
  ]);

  if (reviewedSetting?.value === cycleKey) {
    redirect("/parent");
  }

  const currentSlug = dishwasherSetting?.value ?? "stefan";
  const child = await prisma.child.findUnique({
    where: { slug: currentSlug },
    select: { id: true, slug: true },
  });

  if (!child) {
    redirect("/parent");
  }

  await prisma.transaction.create({
    data: {
      childId: child.id,
      title: weeklyRules.dishwasher.title,
      note:
        outcome === "reward"
          ? `Недельное дежурство по посудомойке принято (${cycleKey}).`
          : `Недельное дежурство по посудомойке не выполнено (${cycleKey}).`,
      points:
        outcome === "reward"
          ? weeklyRules.dishwasher.rewardPoints
          : weeklyRules.dishwasher.penaltyPoints,
      type: outcome === "reward" ? "MANUAL_BONUS" : "MANUAL_PENALTY",
    },
  });

  await Promise.all([
    setHouseholdSetting(householdSettingKeys.dishwasherLastReviewedCycle, cycleKey),
    setHouseholdSetting(
      householdSettingKeys.dishwasherCurrentSlug,
      getNextDishwasherSlug(child.slug),
    ),
  ]);

  refreshScreens();
  redirect("/parent");
}
