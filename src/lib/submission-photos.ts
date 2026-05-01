import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadRoot = path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads", "submissions");
const uploadRootResolved = path.resolve(uploadRoot);
const maxUploadBytes = 8 * 1024 * 1024;

const mimeExtensions = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function getPhotoContentType(photoPath: string) {
  const extension = path.extname(photoPath).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "application/octet-stream";
}

function resolveStoredPath(photoPath: string) {
  const resolvedPath = path.resolve(uploadRoot, path.basename(photoPath));

  if (resolvedPath !== uploadRootResolved && !resolvedPath.startsWith(`${uploadRootResolved}${path.sep}`)) {
    throw new Error("Invalid submission photo path.");
  }

  return resolvedPath;
}

export async function saveSubmissionPhoto(photo: File, childSlug: string) {
  if (photo.size <= 0) {
    throw new Error("Выберите фото для отправки.");
  }

  if (photo.size > maxUploadBytes) {
    throw new Error("Фото слишком большое. Максимум 8 МБ.");
  }

  const extension = mimeExtensions.get(photo.type);

  if (!extension) {
    throw new Error("Можно загрузить только JPG, PNG или WebP.");
  }

  const safeSlug = childSlug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "child";
  const fileName = `${Date.now()}-${safeSlug}-${randomUUID()}.${extension}`;
  const relativePath = path.join("uploads", "submissions", fileName);
  const absolutePath = resolveStoredPath(relativePath);
  const bytes = Buffer.from(await photo.arrayBuffer());

  await mkdir(uploadRoot, { recursive: true });
  await writeFile(absolutePath, bytes, { flag: "wx" });

  return relativePath;
}

export async function readSubmissionPhoto(photoPath: string) {
  return readFile(resolveStoredPath(photoPath));
}

export async function deleteSubmissionPhoto(photoPath: string | null | undefined) {
  if (!photoPath) {
    return;
  }

  try {
    await unlink(resolveStoredPath(photoPath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
