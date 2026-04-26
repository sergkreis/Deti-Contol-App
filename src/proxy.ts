import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  authCookieNames,
  isValidChildSessionValue,
  isValidParentSessionValue,
} from "@/lib/auth-core";

function isParentUnlockPath(pathname: string) {
  return pathname === "/parent/unlock";
}

function getChildSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/child\/([^/]+)/);
  return match?.[1] ?? null;
}

function isChildUnlockPath(pathname: string) {
  return /^\/child\/[^/]+\/unlock$/.test(pathname);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/parent")) {
    if (isParentUnlockPath(pathname)) {
      return NextResponse.next();
    }

    const sessionValue = request.cookies.get(authCookieNames.parent)?.value;

    if (!isValidParentSessionValue(sessionValue)) {
      return NextResponse.redirect(new URL("/parent/unlock", request.url));
    }
  }

  if (pathname.startsWith("/child/")) {
    const slug = getChildSlugFromPath(pathname);

    if (!slug || isChildUnlockPath(pathname)) {
      return NextResponse.next();
    }

    const sessionValue = request.cookies.get(authCookieNames.child)?.value;

    if (!isValidChildSessionValue(sessionValue, slug)) {
      return NextResponse.redirect(new URL(`/child/${slug}/unlock`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/parent/:path*", "/child/:path*"],
};
