"use server";

import { redirect } from "next/navigation";
import {
  clearChildSession,
  clearParentSession,
  createChildSession,
  createParentSession,
  getChildPin,
  getParentPin,
} from "@/lib/auth";

export type AuthState = {
  error?: string;
};

export async function unlockParentAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const pin = String(formData.get("pin") ?? "").trim();

  if (pin !== getParentPin()) {
    return { error: "Неверный PIN родителя." };
  }

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

  if (pin !== getChildPin(slug)) {
    return { error: "Неверный PIN ребенка." };
  }

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
