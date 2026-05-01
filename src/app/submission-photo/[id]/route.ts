import { NextResponse } from "next/server";
import { hasChildSession, hasParentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPhotoContentType, readSubmissionPhoto } from "@/lib/submission-photos";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      child: {
        select: { slug: true },
      },
    },
  });

  if (!submission?.photoPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const authorized =
    (await hasParentSession()) || (await hasChildSession(submission.child.slug));

  if (!authorized) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let photo: Buffer;

  try {
    photo = await readSubmissionPhoto(submission.photoPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }

    throw error;
  }

  return new NextResponse(new Uint8Array(photo), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": getPhotoContentType(submission.photoPath),
    },
  });
}
