import { PrismaClient, SubmissionStatus, TransactionType } from "@prisma/client";
import { dishwasherRotation, householdSettingKeys } from "../src/lib/household";

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.task.deleteMany();
  await prisma.child.deleteMany();

  const children = await prisma.$transaction([
    prisma.child.create({
      data: {
        name: "Stefan",
        slug: "stefan",
        color: "#F97316",
      },
    }),
    prisma.child.create({
      data: {
        name: "Alwina",
        slug: "alwina",
        color: "#14B8A6",
      },
    }),
    prisma.child.create({
      data: {
        name: "Lukas",
        slug: "lukas",
        color: "#3B82F6",
      },
    }),
  ]);

  const tasks = await prisma.$transaction([
    prisma.task.create({
      data: {
        title: "Уборка в комнате",
        category: "Неделя",
        points: 50,
        description: "Проверка по пятницам вечером. Родитель вручную принимает результат или ставит штраф.",
      },
    }),
    prisma.task.create({
      data: {
        title: "Вынос черного мешка",
        category: "Дом",
        points: 20,
        description: "Основной ответственный Lukas, но выполнить может любой ребенок.",
      },
    }),
    prisma.task.create({
      data: {
        title: "Вынос бумаги",
        category: "Дом",
        points: 20,
        description: "Основной ответственный Stefan, но задача остается открытой для всех.",
      },
    }),
    prisma.task.create({
      data: {
        title: "Посудомойка недели",
        category: "Неделя",
        points: 20,
        description: "Недельное дежурство по очереди Stefan → Alwina → Lukas.",
      },
    }),
    prisma.task.create({
      data: {
        title: "Столы в гостиной и кухне",
        category: "Будни",
        points: 10,
        description: "Проверка каждый будний день к возвращению родителя с работы.",
      },
    }),
  ]);

  const [stefan, alwina, lukas] = children;
  const [roomTask, blackBagTask, paperTask, dishwasherTask, tablesTask] = tasks;

  const pendingSubmission = await prisma.submission.create({
    data: {
      childId: lukas.id,
      taskId: blackBagTask.id,
      photoPath: "/uploads/pending/lukas-black-bag.jpg",
      note: "Черный мешок вынесен, ждет подтверждения по фото.",
      status: SubmissionStatus.PENDING,
    },
  });

  const approvedSubmission = await prisma.submission.create({
    data: {
      childId: alwina.id,
      taskId: roomTask.id,
      photoPath: "",
      status: SubmissionStatus.APPROVED,
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        childId: stefan.id,
        title: tablesTask.title,
        note: "Порядок на столах к возвращению родителя.",
        points: 10,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
      {
        childId: stefan.id,
        title: paperTask.title,
        points: 20,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
      },
      {
        childId: alwina.id,
        submissionId: approvedSubmission.id,
        title: roomTask.title,
        note: "Недельная проверка комнаты принята.",
        points: 50,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
      },
      {
        childId: alwina.id,
        title: tablesTask.title,
        note: "Порядок на столах к возвращению родителя.",
        points: 10,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
      {
        childId: lukas.id,
        title: tablesTask.title,
        note: "Порядок на столах к возвращению родителя.",
        points: 10,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
      {
        childId: lukas.id,
        submissionId: pendingSubmission.id,
        title: blackBagTask.title,
        note: "Ждет подтверждения по фото.",
        points: 0,
        type: TransactionType.REJECTION,
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        childId: lukas.id,
        title: dishwasherTask.title,
        note: "Дежурство по посудомойке на прошлой неделе было принято.",
        points: 20,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
    ],
  });

  await prisma.setting.createMany({
    data: [
      {
        key: householdSettingKeys.dishwasherCurrentSlug,
        value: dishwasherRotation[0],
      },
      {
        key: householdSettingKeys.roomLastReviewed(stefan.slug),
        value: "2000-01-07",
      },
      {
        key: householdSettingKeys.roomLastReviewed(alwina.slug),
        value: "2000-01-07",
      },
      {
        key: householdSettingKeys.roomLastReviewed(lukas.slug),
        value: "2000-01-07",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
