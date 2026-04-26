import { headers } from "next/headers";

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 10 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

type AttemptState = {
  failures: number;
  firstFailureAt: number;
  blockedUntil: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __detiRateLimitStore?: Map<string, AttemptState>;
};

const rateLimitStore = globalForRateLimit.__detiRateLimitStore ?? new Map<string, AttemptState>();

if (!globalForRateLimit.__detiRateLimitStore) {
  globalForRateLimit.__detiRateLimitStore = rateLimitStore;
}

function getStoreKey(scope: string, clientId: string) {
  return `${scope}:${clientId}`;
}

function getClientIdFromHeaderValue(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  const firstValue = headerValue.split(",")[0]?.trim();
  return firstValue || null;
}

export async function getRequestClientId() {
  const headerStore = await headers();
  return (
    getClientIdFromHeaderValue(headerStore.get("x-forwarded-for")) ??
    getClientIdFromHeaderValue(headerStore.get("x-real-ip")) ??
    "unknown"
  );
}

export async function getRateLimitStatus(scope: string) {
  const clientId = await getRequestClientId();
  const state = rateLimitStore.get(getStoreKey(scope, clientId));

  if (!state) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  const now = Date.now();

  if (state.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((state.blockedUntil - now) / 1000),
    };
  }

  if (state.blockedUntil > 0 || state.firstFailureAt + ATTEMPT_WINDOW_MS <= now) {
    rateLimitStore.delete(getStoreKey(scope, clientId));
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export async function registerFailedAttempt(scope: string) {
  const clientId = await getRequestClientId();
  const key = getStoreKey(scope, clientId);
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.firstFailureAt + ATTEMPT_WINDOW_MS <= now) {
    rateLimitStore.set(key, {
      failures: 1,
      firstFailureAt: now,
      blockedUntil: 0,
    });
    return;
  }

  const failures = current.failures + 1;

  if (failures >= MAX_FAILED_ATTEMPTS) {
    rateLimitStore.set(key, {
      failures: 0,
      firstFailureAt: now,
      blockedUntil: now + BLOCK_DURATION_MS,
    });
    return;
  }

  rateLimitStore.set(key, {
    failures,
    firstFailureAt: current.firstFailureAt,
    blockedUntil: 0,
  });
}

export async function clearFailedAttempts(scope: string) {
  const clientId = await getRequestClientId();
  rateLimitStore.delete(getStoreKey(scope, clientId));
}
