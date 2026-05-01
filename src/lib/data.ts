import { SubmissionStatus } from "@prisma/client";
import { hasParentSession } from "@/lib/auth";
import {
  collectiveRules,
  getHouseholdState,
  responsibilityTemplates,
  weeklyRules,
} from "@/lib/household";
import { prisma } from "@/lib/prisma";

function buildBalance(points: Array<{ points: number }>) {
  return points.reduce((sum, item) => sum + item.points, 0);
}

export async function getDashboardData() {
  const [children, pendingCount, recentTransactions, householdState, parentUnlocked] =
    await Promise.all([
      prisma.child.findMany({
        where: { isActive: true },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
          },
          submissions: {
            where: { status: SubmissionStatus.PENDING },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.submission.count({
        where: { status: SubmissionStatus.PENDING },
      }),
      prisma.transaction.findMany({
        include: {
          child: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      getHouseholdState(),
      hasParentSession(),
    ]);

  const currentDishwasherChild = children.find(
    (child) => child.slug === householdState.currentDishwasherSlug,
  );

  const responsibilityNotes = responsibilityTemplates.map((item) => {
    if (item.id === "dishwasher") {
      return {
        title: item.title,
        owner: currentDishwasherChild?.name ?? "Stefan",
        note: item.note,
      };
    }

    const owner = children.find((child) => child.slug === item.ownerSlug);

    return {
      title: item.title,
      owner: owner?.name ?? item.ownerSlug ?? "Не назначен",
      note: item.note,
    };
  });

  return {
    children: children.map((child) => {
      const roomReviewed =
        householdState.roomLastReviewedBySlug[child.slug] === householdState.currentRoomCycleKey;
      const statuses = [
        roomReviewed ? "Комната: неделя закрыта" : "Комната: проверка в пятницу",
        child.slug === householdState.currentDishwasherSlug
          ? "Посудомойка: твоя неделя"
          : child.submissions.length > 0
            ? `Заявки: ${child.submissions.length}`
            : "Все спокойно",
      ];

      return {
        id: child.id,
        name: child.name,
        slug: child.slug,
        color: child.color,
        balance: buildBalance(child.transactions),
        pendingCount: child.submissions.length,
        statuses,
      };
    }),
    pendingCount,
    parentUnlocked,
    collectiveRules,
    weeklyFocus: [
      {
        ...weeklyRules.room,
        cycleLabel: householdState.roomCycleLabel,
      },
      {
        ...weeklyRules.dishwasher,
        cycleLabel: householdState.dishwasherCycleLabel,
        currentOwnerName: currentDishwasherChild?.name ?? "Stefan",
      },
    ],
    responsibilityNotes,
    recentTransactions,
  };
}

export async function getChildPageData(slug: string) {
  const child = await prisma.child.findUnique({
    where: { slug },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      submissions: {
        include: {
          task: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 6,
      },
    },
  });

  if (!child) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return {
    child: {
      ...child,
      balance: buildBalance(child.transactions),
    },
    tasks,
  };
}

export async function getParentPageData() {
  const [children, pendingSubmissions, tasks, transactions, householdState] = await Promise.all([
    prisma.child.findMany({
      include: {
        transactions: true,
        submissions: {
          where: { status: SubmissionStatus.PENDING },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.submission.findMany({
      where: { status: SubmissionStatus.PENDING },
      include: {
        child: true,
        task: true,
      },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.task.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
    prisma.transaction.findMany({
      include: {
        child: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    getHouseholdState(),
  ]);

  const currentDishwasherChild = children.find(
    (child) => child.slug === householdState.currentDishwasherSlug,
  );

  const responsibilityNotes = responsibilityTemplates.map((item) => {
    if (item.id === "dishwasher") {
      return {
        title: item.title,
        owner: currentDishwasherChild?.name ?? "Stefan",
        note: item.note,
      };
    }

    const owner = children.find((child) => child.slug === item.ownerSlug);

    return {
      title: item.title,
      owner: owner?.name ?? item.ownerSlug ?? "Не назначен",
      note: item.note,
    };
  });

  return {
    summary: children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      color: child.color,
      balance: buildBalance(child.transactions),
    })),
    children: children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      color: child.color,
      balance: buildBalance(child.transactions),
      pendingCount: child.submissions.length,
      roomReviewed:
        householdState.roomLastReviewedBySlug[child.slug] === householdState.currentRoomCycleKey,
    })),
    pendingSubmissions,
    tasks,
    transactions,
    collectiveRules,
    responsibilityNotes,
    weeklyReview: {
      room: {
        ...weeklyRules.room,
        cycleKey: householdState.currentRoomCycleKey,
        cycleLabel: householdState.roomCycleLabel,
      },
      dishwasher: {
        ...weeklyRules.dishwasher,
        cycleKey: householdState.currentDishwasherCycleKey,
        cycleLabel: householdState.dishwasherCycleLabel,
        currentChild: currentDishwasherChild
          ? {
              id: currentDishwasherChild.id,
              name: currentDishwasherChild.name,
              slug: currentDishwasherChild.slug,
              color: currentDishwasherChild.color,
              balance: buildBalance(currentDishwasherChild.transactions),
            }
          : null,
        alreadyReviewed:
          householdState.lastDishwasherReviewedCycle === householdState.currentDishwasherCycleKey,
      },
    },
  };
}
