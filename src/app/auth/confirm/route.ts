import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const code = url.searchParams.get("code");
  const base = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const s = await db();
  let ok = false;
  if (hash && (type === "invite" || type === "recovery")) {
    const { error } = await s.auth.verifyOtp({ token_hash: hash, type });
    ok = !error;
  } else if (code) {
    const { error } = await s.auth.exchangeCodeForSession(code);
    ok = !error;
  }
  return NextResponse.redirect(
    new URL(
      ok ? "/auth/palavra-passe" : "/admin/login?erro=ligacao-expirada",
      base,
    ),
  );
}
