import { NextResponse } from "next/server";
export async function GET(request: Request) {
  return NextResponse.redirect(
    new URL("/admin/login", process.env.NEXT_PUBLIC_SITE_URL || request.url),
  );
}
