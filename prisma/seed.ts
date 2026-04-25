import { PrismaClient, SubmissionStatus, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
        title: "Развесить одежду после стирки",
        category: "Стирка",
        points: 20,
      },
    }),
    prisma.task.create({
      data: {
        title: "Запуск стирки",
        category: "Стирка",
        points: 20,
      },
    }),
    prisma.task.create({
      data: {
        title: "Снять одежду после стирки",
        category: "Стирка",
        points: 20,
      },
    }),
    prisma.task.create({
      data: {
        title: "Убрать стол в кухне или гостиной",
        category: "Кухня",
        points: 10,
      },
    }),
    prisma.task.create({
      data: {
        title: "Убрать шкаф",
        category: "Порядок",
        points: 30,
      },
    }),
    prisma.task.create({
      data: {
        title: "Уборка в комнате",
        category: "Комната",
        points: 50,
      },
    }),
    prisma.task.create({
      data: {
        title: "Вынос мусора или бумаги",
        category: "Дом",
        points: 20,
      },
    }),
    prisma.task.create({
      data: {
        title: "Загрузка посудомойки",
        category: "Кухня",
        points: 20,
      },
    }),
  ]);

  const [stefan, alwina, lukas] = children;
  const [laundryHang, laundryStart, laundryRemove, tableTask, wardrobeTask, roomTask, trashTask] = tasks;

  const pendingSubmission = await prisma.submission.create({
    data: {
      childId: lukas.id,
      taskId: trashTask.id,
      photoPath: "/uploads/pending/lukas-trash-photo.jpg",
      note: "Сделал фото сразу после выноса пакета.",
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
        title: laundryHang.title,
        points: 20,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
      {
        childId: stefan.id,
        title: "Ручной штраф",
        note: "Не убрал стол после ужина.",
        points: -30,
        type: TransactionType.MANUAL_PENALTY,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
      },
      {
        childId: alwina.id,
        submissionId: approvedSubmission.id,
        title: roomTask.title,
        points: 50,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
      },
      {
        childId: alwina.id,
        title: wardrobeTask.title,
        points: 30,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
      {
        childId: lukas.id,
        title: laundryStart.title,
        points: 20,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9),
      },
      {
        childId: lukas.id,
        title: tableTask.title,
        points: 10,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        childId: lukas.id,
        submissionId: pendingSubmission.id,
        title: trashTask.title,
        note: "Ждет подтверждения по фото.",
        points: 0,
        type: TransactionType.REJECTION,
        createdAt: new Date(Date.now() - 1000 * 60 * 8),
      },
      {
        childId: stefan.id,
        title: laundryRemove.title,
        points: 20,
        type: TransactionType.REWARD,
        createdAt: new Date(Date.now() - 1000 * 60 * 2),
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
