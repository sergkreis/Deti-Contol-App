"use server";

import { redirect } from "next/navigation";
import {
  clearChildSession,
  clearParentSession,
  createChildSession,
  createParentSession,
  getParentPinCredential,
  hasChildSession,
  validatePin,
} from "@/lib/auth";
import {
  clearFailedAttempts,
  getRateLimitStatus,
  registerFailedAttempt,
} from "@/lib/auth-rate-limit";
import {
  isValidChildPinFormat,
  setChildPin,
  validateChildPin,
} from "@/lib/child-pins";

export type AuthState = {
  error?: string;
};

export type ChildPinState = {
  error?: string;
  success?: string;
};

function getRateLimitError(retryAfterSeconds: number) {
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Слишком много неверных попыток. Попробуйте снова через ${retryAfterMinutes} мин.`;
}

export async function unlockParentAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const pin = String(formData.get("pin") ?? "").trim();
  const scope = "parent";
  const rateLimit = await getRateLimitStatus(scope);

  if (rateLimit.blocked) {
    return { error: getRateLimitError(rateLimit.retryAfterSeconds) };
  }

  if (!(await validatePin(pin, getParentPinCredential()))) {
    await registerFailedAttempt(scope);
    return { error: "Неверный PIN родителя." };
  }

  await clearFailedAttempts(scope);
  await createParentSession();
  redirect("/parent");
}

export async function unlockChildAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!slug) {
    return { error: "Не удалось определить профиль ребенка." };
  }

  const scope = `child:${slug}`;
  const rateLimit = await getRateLimitStatus(scope);

  if (rateLimit.blocked) {
    return { error: getRateLimitError(rateLimit.retryAfterSeconds) };
  }

  if (!(await validateChildPin(slug, pin))) {
    await registerFailedAttempt(scope);
    return { error: "Неверный PIN ребенка." };
  }

  await clearFailedAttempts(scope);
  await createChildSession(slug);
  redirect(`/child/${slug}`);
}

export async function logoutParentAction() {
  await clearParentSession();
  redirect("/");
}

export async function logoutChildAction() {
  await clearChildSession();
  redirect("/");
}

export async function updateChildPinAction(
  slug: string,
  _prevState: ChildPinState,
  formData: FormData,
): Promise<ChildPinState> {
  if (!(await hasChildSession(slug))) {
    redirect(`/child/${slug}/unlock`);
  }

  const currentPin = String(formData.get("currentPin") ?? "").trim();
  const newPin = String(formData.get("newPin") ?? "").trim();
  const confirmPin = String(formData.get("confirmPin") ?? "").trim();

  if (!(await validateChildPin(slug, currentPin))) {
    return { error: "Текущий PIN введен неверно." };
  }

  if (!isValidChildPinFormat(newPin)) {
    return { error: "Новый PIN должен состоять из 4 цифр." };
  }

  if (newPin !== confirmPin) {
    return { error: "Подтверждение PIN не совпадает." };
  }

  await setChildPin(slug, newPin);
  await clearFailedAttempts(`child:${slug}`);

  return { success: "PIN обновлен." };
}
