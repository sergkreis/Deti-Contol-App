import { SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [children, pendingCount] = await Promise.all([
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
  ]);

  return {
    children: children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      color: child.color,
      balance: child.transactions.reduce((sum, item) => sum + item.points, 0),
      pendingCount: child.submissions.length,
      latestAction: child.transactions[0] ?? null,
    })),
    pendingCount,
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
    orderBy: [{ category: "asc" }, { points: "asc" }],
  });

  return {
    child: {
      ...child,
      balance: child.transactions.reduce((sum, item) => sum + item.points, 0),
    },
    tasks,
  };
}

export async function getParentPageData() {
  const [children, pendingSubmissions, tasks, transactions] = await Promise.all([
    prisma.child.findMany({
      include: {
        transactions: true,
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
      orderBy: [{ category: "asc" }, { points: "asc" }],
    }),
    prisma.transaction.findMany({
      include: {
        child: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return {
    summary: children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      color: child.color,
      balance: child.transactions.reduce((sum, item) => sum + item.points, 0),
    })),
    pendingSubmissions,
    tasks,
    transactions,
  };
}
