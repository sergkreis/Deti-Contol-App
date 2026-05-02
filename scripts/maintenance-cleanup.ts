import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteSubmissionPhoto } from "@/lib/submission-photos";

const uploadRoot = path.join(process.cwd(), "uploads", "submissions");
const orphanGraceMs = 60 * 60 * 1000;
const rateLimitRetentionMs = 24 * 60 * 60 * 1000;

function normalizeStoredPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

async function listUploadFiles() {
  try {
    const entries = await readdir(uploadRoot, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(uploadRoot, entry.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function cleanupReviewedPhotos() {
  const reviewedSubmissions = await prisma.submission.findMany({
    where: {
      status: {
        not: SubmissionStatus.PENDING,
      },
      photoPath: {
        not: "",
      },
    },
    select: {
      id: true,
      photoPath: true,
      status: true,
    },
  });

  let removed = 0;

  for (const submission of reviewedSubmissions) {
    try {
      await deleteSubmissionPhoto(submission.photoPath);
      removed += 1;
    } catch (error) {
      console.error(`Failed to delete reviewed photo for ${submission.id}:`, error);
    }
  }

  return removed;
}

async function cleanupOrphanPhotos() {
  const submissions = await prisma.submission.findMany({
    select: {
      photoPath: true,
    },
  });
  const referencedPaths = new Set(
    submissions.map((submission) => normalizeStoredPath(submission.photoPath)),
  );
  const files = await listUploadFiles();
  const cutoff = Date.now() - orphanGraceMs;
  let removed = 0;

  for (const filePath of files) {
    const relativePath = normalizeStoredPath(path.relative(process.cwd(), filePath));

    if (referencedPaths.has(relativePath)) {
      continue;
    }

    const fileStat = await stat(filePath);

    if (fileStat.mtimeMs > cutoff) {
      continue;
    }

    await unlink(filePath);
    removed += 1;
  }

  return removed;
}

async function cleanupRateLimits() {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - rateLimitRetentionMs);

  const result = await prisma.authRateLimit.deleteMany({
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

  return result.count;
}

async function main() {
  const [reviewedPhotos, orphanPhotos, rateLimitRows] = await Promise.all([
    cleanupReviewedPhotos(),
    cleanupOrphanPhotos(),
    cleanupRateLimits(),
  ]);

  console.log(
    [
      `reviewed photos checked/deleted: ${reviewedPhotos}`,
      `orphan photos deleted: ${orphanPhotos}`,
      `rate-limit rows deleted: ${rateLimitRows}`,
    ].join("\n"),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
