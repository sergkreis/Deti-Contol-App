import { getChildPin as getEnvChildPin, validatePin } from "@/lib/auth-core";
import { hashPin, isHashedPin } from "@/lib/pin-hash";
import { prisma } from "@/lib/prisma";

const childPinSettingPrefix = "child.pin.";

function childPinSettingKey(slug: string) {
  return `${childPinSettingPrefix}${slug}`;
}

export function isValidChildPinFormat(pin: string) {
  return /^\d{4}$/.test(pin);
}

export async function getChildPinCredential(slug: string) {
  const setting = await prisma.setting.findUnique({
    where: { key: childPinSettingKey(slug) },
    select: { value: true },
  });

  return setting?.value ?? getEnvChildPin(slug);
}

export async function setChildPin(slug: string, pin: string) {
  const hashedPin = await hashPin(pin);

  await prisma.setting.upsert({
    where: { key: childPinSettingKey(slug) },
    update: { value: hashedPin },
    create: {
      key: childPinSettingKey(slug),
      value: hashedPin,
    },
  });
}

export async function validateChildPin(slug: string, inputPin: string) {
  const credential = await getChildPinCredential(slug);
  const isValid = await validatePin(inputPin, credential);

  if (isValid && !isHashedPin(credential)) {
    await setChildPin(slug, inputPin);
  }

  return isValid;
}
