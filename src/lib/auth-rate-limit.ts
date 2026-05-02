import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 10 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

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
    getClientIdFromHeaderValue(headerStore.get("x-real-ip")) ??
    getClientIdFromHeaderValue(headerStore.get("x-forwarded-for")) ??
    "unknown"
  );
}

async function pruneExpiredAttempts(now: Date) {
  const staleBefore = new Date(now.getTime() - ATTEMPT_WINDOW_MS);

  await prisma.authRateLimit.deleteMany({
    where: {
      OR: [
        {
          blockedUntil: {
            not: null,
            lte: now,
          },
        },
        {
          blockedUntil: null,
          updatedAt: {
            lte: staleBefore,
          },
        },
      ],
    },
  });
}

export async function getRateLimitStatus(scope: string) {
  const clientId = await getRequestClientId();
  const key = getStoreKey(scope, clientId);
  const state = await prisma.authRateLimit.findUnique({ where: { key } });

  if (!state) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  const now = new Date();

  if (state.blockedUntil && state.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((state.blockedUntil.getTime() - now.getTime()) / 1000),
    };
  }

  if (
    state.blockedUntil ||
    state.firstFailureAt.getTime() + ATTEMPT_WINDOW_MS <= now.getTime()
  ) {
    await prisma.authRateLimit.delete({ where: { key } }).catch(() => null);
    await pruneExpiredAttempts(now);
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export async function registerFailedAttempt(scope: string) {
  const clientId = await getRequestClientId();
  const key = getStoreKey(scope, clientId);
  const now = new Date();
  const current = await prisma.authRateLimit.findUnique({ where: { key } });

  if (!current || current.firstFailureAt.getTime() + ATTEMPT_WINDOW_MS <= now.getTime()) {
    await prisma.authRateLimit.upsert({
      where: { key },
      update: {
        failures: 1,
        firstFailureAt: now,
        blockedUntil: null,
      },
      create: {
        key,
        failures: 1,
        firstFailureAt: now,
      },
    });
    return;
  }

  const failures = current.failures + 1;

  if (failures >= MAX_FAILED_ATTEMPTS) {
    await prisma.authRateLimit.update({
      where: { key },
      data: {
        failures: 0,
        firstFailureAt: now,
        blockedUntil: new Date(now.getTime() + BLOCK_DURATION_MS),
      },
    });
    return;
  }

  await prisma.authRateLimit.update({
    where: { key },
    data: {
      failures,
      firstFailureAt: current.firstFailureAt,
      blockedUntil: null,
    },
  });
}

export async function clearFailedAttempts(scope: string) {
  const clientId = await getRequestClientId();
  await prisma.authRateLimit.delete({ where: { key: getStoreKey(scope, clientId) } }).catch(() => null);
}
