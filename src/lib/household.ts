import { prisma } from "@/lib/prisma";

export const collectiveRules = [
  {
    id: "tables-clean",
    title: "Столы в гостиной и кухне",
    rewardPoints: 10,
    penaltyPoints: -30,
    description: "Проверка каждый будний день к возвращению родителя с работы.",
  },
] as const;

export const weeklyRules = {
  room: {
    id: "room-review",
    title: "Уборка в комнате",
    rewardPoints: 50,
    penaltyPoints: -70,
    description: "Еженедельная проверка по пятницам вечером отдельно для каждого ребенка.",
  },
  dishwasher: {
    id: "dishwasher-rotation",
    title: "Посудомойка недели",
    rewardPoints: 20,
    penaltyPoints: -30,
    description: "Недельное дежурство с ротацией по кругу с понедельника по воскресенье.",
  },
} as const;

export const responsibilityTemplates = [
  {
    id: "trash-black",
    title: "Черный мешок",
    ownerSlug: "lukas",
    note: "Основной ответственный, но задачу может выполнить любой ребенок.",
  },
  {
    id: "paper",
    title: "Бумага",
    ownerSlug: "stefan",
    note: "Основной ответственный, но задача остается открытой для всех.",
  },
  {
    id: "dishwasher",
    title: "Посудомойка недели",
    ownerSlug: null,
    note: "Дежурный определяется автоматически по недельной ротации.",
  },
] as const;

export const dishwasherRotation = ["stefan", "alwina", "lukas"] as const;

export const householdSettingKeys = {
  dishwasherCurrentSlug: "dishwasher.currentSlug",
  dishwasherLastReviewedCycle: "dishwasher.lastReviewedCycle",
  roomLastReviewed: (slug: string) => `room.lastReviewed.${slug}`,
} as const;

function getBerlinWallClockDate(date = new Date()) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShortRuDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function getCurrentDishwasherCycleKey(date = new Date()) {
  const berlinDate = getBerlinWallClockDate(date);
  const weekday = berlinDate.getDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(berlinDate);

  monday.setHours(0, 0, 0, 0);
  monday.setDate(berlinDate.getDate() + diffToMonday);

  return formatIsoDate(monday);
}

export function getCurrentRoomCycleKey(date = new Date()) {
  const berlinDate = getBerlinWallClockDate(date);
  const weekday = berlinDate.getDay();
  const diffToFriday = weekday === 6 ? 6 : 5 - weekday;
  const friday = new Date(berlinDate);

  friday.setHours(0, 0, 0, 0);
  friday.setDate(berlinDate.getDate() + diffToFriday);

  return formatIsoDate(friday);
}

export function getDishwasherCycleLabel(date = new Date()) {
  const berlinDate = getBerlinWallClockDate(date);
  const weekday = berlinDate.getDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(berlinDate);
  const sunday = new Date(berlinDate);

  monday.setHours(0, 0, 0, 0);
  sunday.setHours(0, 0, 0, 0);

  monday.setDate(berlinDate.getDate() + diffToMonday);
  sunday.setDate(monday.getDate() + 6);

  return `${formatShortRuDate(monday)} - ${formatShortRuDate(sunday)}`;
}

export function getRoomCycleLabel(date = new Date()) {
  const friday = getBerlinWallClockDate(date);
  const weekday = friday.getDay();
  const diffToFriday = weekday === 6 ? 6 : 5 - weekday;

  friday.setHours(0, 0, 0, 0);
  friday.setDate(friday.getDate() + diffToFriday);

  return `до ${formatShortRuDate(friday)}`;
}

export function getNextDishwasherSlug(currentSlug: string) {
  const currentIndex = dishwasherRotation.indexOf(currentSlug as (typeof dishwasherRotation)[number]);

  if (currentIndex === -1) {
    return dishwasherRotation[0];
  }

  return dishwasherRotation[(currentIndex + 1) % dishwasherRotation.length];
}

export async function getHouseholdState() {
  const currentDishwasherCycleKey = getCurrentDishwasherCycleKey();
  const currentRoomCycleKey = getCurrentRoomCycleKey();
  const roomSettingKeys = dishwasherRotation.map((slug) => householdSettingKeys.roomLastReviewed(slug));

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          householdSettingKeys.dishwasherCurrentSlug,
          householdSettingKeys.dishwasherLastReviewedCycle,
          ...roomSettingKeys,
        ],
      },
    },
  });

  const valueByKey = new Map(settings.map((setting) => [setting.key, setting.value]));
  const currentDishwasherSlug =
    valueByKey.get(householdSettingKeys.dishwasherCurrentSlug) ?? dishwasherRotation[0];

  if (!valueByKey.has(householdSettingKeys.dishwasherCurrentSlug)) {
    await prisma.setting.upsert({
      where: { key: householdSettingKeys.dishwasherCurrentSlug },
      update: { value: currentDishwasherSlug },
      create: {
        key: householdSettingKeys.dishwasherCurrentSlug,
        value: currentDishwasherSlug,
      },
    });
  }

  return {
    currentDishwasherSlug,
    currentDishwasherCycleKey,
    dishwasherCycleLabel: getDishwasherCycleLabel(),
    currentRoomCycleKey,
    roomCycleLabel: getRoomCycleLabel(),
    lastDishwasherReviewedCycle:
      valueByKey.get(householdSettingKeys.dishwasherLastReviewedCycle) ?? null,
    roomLastReviewedBySlug: Object.fromEntries(
      dishwasherRotation.map((slug) => [
        slug,
        valueByKey.get(householdSettingKeys.roomLastReviewed(slug)) ?? null,
      ]),
    ) as Record<string, string | null>,
  };
}

export async function setHouseholdSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
