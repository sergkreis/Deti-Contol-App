"use server";

import { redirect } from "next/navigation";
import {
  clearChildSession,
  clearParentSession,
  createChildSession,
  createParentSession,
  getChildPin,
  getParentPin,
  validatePin,
} from "@/lib/auth";
import {
  clearFailedAttempts,
  getRateLimitStatus,
  registerFailedAttempt,
} from "@/lib/auth-rate-limit";

export type AuthState = {
  error?: string;
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

  if (!validatePin(pin, getParentPin())) {
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

  if (!validatePin(pin, getChildPin(slug))) {
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
