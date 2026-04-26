import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const authCookieNames = {
  parent: "deti-parent-session",
  child: "deti-child-session",
} as const;

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionKind = "parent" | "child";

type SessionPayload = {
  kind: SessionKind;
  slug?: string;
  exp: number;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function childPinEnvKey(slug: string) {
  return `CHILD_PIN_${slug.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
}

function getSessionSecret() {
  return getRequiredEnv("SESSION_SECRET");
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string) {
  const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;

  if (!parsed || (parsed.kind !== "parent" && parsed.kind !== "child")) {
    return null;
  }

  if (!Number.isFinite(parsed.exp)) {
    return null;
  }

  return parsed;
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
}

function createSignedSessionValue(payload: SessionPayload) {
  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function safeEqualText(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function verifySignedSessionValue(rawValue: string | undefined) {
  if (!rawValue) {
    return null;
  }

  const separatorIndex = rawValue.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const encodedPayload = rawValue.slice(0, separatorIndex);
  const receivedSignature = rawValue.slice(separatorIndex + 1);
  const expectedSignature = signPayload(encodedPayload);

  if (!safeEqualText(receivedSignature, expectedSignature)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);

  if (!payload) {
    return null;
  }

  if (payload.exp <= Date.now()) {
    return null;
  }

  return payload;
}

function createSessionPayload(kind: SessionKind, slug?: string): SessionPayload {
  return {
    kind,
    slug,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
}

export function getParentPin() {
  return getRequiredEnv("PARENT_PIN");
}

export function getChildPin(slug: string) {
  return getRequiredEnv(childPinEnvKey(slug));
}

export function isValidParentSessionValue(rawValue: string | undefined) {
  const payload = verifySignedSessionValue(rawValue);
  return payload?.kind === "parent";
}

export function isValidChildSessionValue(rawValue: string | undefined, slug: string) {
  const payload = verifySignedSessionValue(rawValue);
  return payload?.kind === "child" && payload.slug === slug;
}

export function validatePin(inputPin: string, expectedPin: string) {
  return safeEqualText(inputPin, expectedPin);
}

export function createParentSessionValue() {
  return createSignedSessionValue(createSessionPayload("parent"));
}

export function createChildSessionValue(slug: string) {
  return createSignedSessionValue(createSessionPayload("child", slug));
}
