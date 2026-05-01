import { getChildPin as getEnvChildPin, validatePin } from "@/lib/auth-core";
import { prisma } from "@/lib/prisma";

const childPinSettingPrefix = "child.pin.";

function childPinSettingKey(slug: string) {
  return `${childPinSettingPrefix}${slug}`;
}

export function isValidChildPinFormat(pin: string) {
  return /^\d{4}$/.test(pin);
}

export async function getChildPin(slug: string) {
  const setting = await prisma.setting.findUnique({
    where: { key: childPinSettingKey(slug) },
    select: { value: true },
  });

  return setting?.value ?? getEnvChildPin(slug);
}

export async function setChildPin(slug: string, pin: string) {
  await prisma.setting.upsert({
    where: { key: childPinSettingKey(slug) },
    update: { value: pin },
    create: {
      key: childPinSettingKey(slug),
      value: pin,
    },
  });
}

export async function validateChildPin(slug: string, inputPin: string) {
  return validatePin(inputPin, await getChildPin(slug));
}
