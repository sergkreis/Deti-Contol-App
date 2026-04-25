import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PARENT_COOKIE = "deti-parent-session";
const CHILD_COOKIE = "deti-child-session";

const SESSION_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function childPinEnvKey(slug: string) {
  return `CHILD_PIN_${slug.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
}

export function getParentPin() {
  return process.env.PARENT_PIN?.trim() ?? "1234";
}

export function getChildPin(slug: string) {
  return process.env[childPinEnvKey(slug)]?.trim() ?? "1111";
}

export async function createParentSession() {
  const store = await cookies();
  store.set(PARENT_COOKIE, "ok", SESSION_OPTIONS);
}

export async function clearParentSession() {
  const store = await cookies();
  store.delete(PARENT_COOKIE);
}

export async function hasParentSession() {
  const store = await cookies();
  return store.get(PARENT_COOKIE)?.value === "ok";
}

export async function requireParentSession() {
  if (!(await hasParentSession())) {
    redirect("/parent/unlock");
  }
}

export async function createChildSession(slug: string) {
  const store = await cookies();
  store.set(CHILD_COOKIE, slug, SESSION_OPTIONS);
}

export async function clearChildSession() {
  const store = await cookies();
  store.delete(CHILD_COOKIE);
}

export async function hasChildSession(slug: string) {
  const store = await cookies();
  return store.get(CHILD_COOKIE)?.value === slug;
}

export async function requireChildSession(slug: string) {
  if (!(await hasChildSession(slug))) {
    redirect(`/child/${slug}/unlock`);
  }
}
