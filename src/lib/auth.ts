import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authCookieNames,
  createChildSessionValue,
  createParentSessionValue,
  getChildPin,
  getParentPin,
  isValidChildSessionValue,
  isValidParentSessionValue,
  SESSION_MAX_AGE_SECONDS,
  validatePin,
} from "@/lib/auth-core";

const SESSION_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.SESSION_SECURE_COOKIE === "true",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function createParentSession() {
  const store = await cookies();
  store.set(authCookieNames.parent, createParentSessionValue(), SESSION_OPTIONS);
}

export async function clearParentSession() {
  const store = await cookies();
  store.delete(authCookieNames.parent);
}

export async function hasParentSession() {
  const store = await cookies();
  return isValidParentSessionValue(store.get(authCookieNames.parent)?.value);
}

export async function requireParentSession() {
  if (!(await hasParentSession())) {
    redirect("/parent/unlock");
  }
}

export async function createChildSession(slug: string) {
  const store = await cookies();
  store.set(authCookieNames.child, createChildSessionValue(slug), SESSION_OPTIONS);
}

export async function clearChildSession() {
  const store = await cookies();
  store.delete(authCookieNames.child);
}

export async function hasChildSession(slug: string) {
  const store = await cookies();
  return isValidChildSessionValue(store.get(authCookieNames.child)?.value, slug);
}

export async function requireChildSession(slug: string) {
  if (!(await hasChildSession(slug))) {
    redirect(`/child/${slug}/unlock`);
  }
}

export { getChildPin, getParentPin, validatePin };
