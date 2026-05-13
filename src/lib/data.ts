import { SubmissionStatus } from "@prisma/client";
import { hasParentSession } from "@/lib/auth";
import {
  collectiveRules,
  getHouseholdState,
  responsibilityTemplates,
  weeklyRules,
} from "@/lib/household";
import { prisma } from "@/lib/prisma";

async function getBalancesByChildId(childIds: string[]) {
  if (childIds.length === 0) {
    return new Map<string, number>();
  }

  const balances = await prisma.transaction.groupBy({
    by: ["childId"],
    where: {
      childId: {
        in: childIds,
      },
    },
    _sum: {
      points: true,
    },
  });

  return new Map(
    balances.map((balance) => [balance.childId, balance._sum.points ?? 0]),
  );
}

export async function getDashboardData() {
  const [children, pendingCount, recentTransactions, householdState, parentUnlocked] =
    await Promise.all([
      prisma.child.findMany({
        where: { isActive: true },
        include: {
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
  const balanceByChildId = await getBalancesByChildId(children.map((child) => child.id));

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
        roomReviewed ? "Комната: закрыта" : "Комната: пятница",
        child.slug === householdState.currentDishwasherSlug
          ? "Посудомойка: дежурный"
          : child.submissions.length > 0
            ? `Заявки: ${child.submissions.length}`
            : "Все спокойно",
      ];

      return {
        id: child.id,
        name: child.name,
        slug: child.slug,
        color: child.color,
        balance: balanceByChildId.get(child.id) ?? 0,
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
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      isActive: true,
      createdAt: true,
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

  const [tasks, balance] = await Promise.all([
    prisma.task.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
    prisma.transaction.aggregate({
      where: { childId: child.id },
      _sum: { points: true },
    }),
  ]);

  return {
    child: {
      ...child,
      balance: balance._sum.points ?? 0,
    },
    tasks,
  };
}

export async function getParentPageData() {
  const [children, pendingSubmissions, tasks, transactions, householdState] = await Promise.all([
    prisma.child.findMany({
      include: {
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
  const balanceByChildId = await getBalancesByChildId(children.map((child) => child.id));

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
      balance: balanceByChildId.get(child.id) ?? 0,
    })),
    children: children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      color: child.color,
      balance: balanceByChildId.get(child.id) ?? 0,
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
              balance: balanceByChildId.get(currentDishwasherChild.id) ?? 0,
            }
          : null,
        alreadyReviewed:
          householdState.lastDishwasherReviewedCycle === householdState.currentDishwasherCycleKey,
      },
    },
  };
}
