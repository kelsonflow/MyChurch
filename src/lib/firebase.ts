import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { auth, firestore, configured } from "./firebase-admin";
import { assertAccess, type Profile } from "./access";
import { Timestamp } from "firebase-admin/firestore";
export { configured };
const sessionHash = (nonce: string) =>
  createHash("sha256").update(nonce).digest("hex");
export async function staff(admin = false) {
  if (!configured())
    throw new Error("O acesso Firebase ainda não está configurado.");
  const value = (await cookies()).get("__session")?.value;
  const [jwt, nonce, ...extra] = (value || "").split("~");
  if (!jwt || !nonce || extra.length)
    throw new Error("Inicie sessão para continuar.");
  const decoded = await auth().verifySessionCookie(jwt, true);
  const db = firestore();
  const [p, s] = await db.getAll(
    db.doc(`profiles/${decoded.uid}`),
    db.doc(`sessions/${sessionHash(nonce)}`),
  );
  const profile = assertAccess(
    p.exists ? ({ ...p.data(), id: p.id } as Profile) : undefined,
    admin,
  );
  if (
    !s.exists ||
    s.get("uid") !== decoded.uid ||
    s.get("version") !== profile.version ||
    s.get("expires_at") < Date.now()
  )
    throw new Error("A sessão expirou ou foi revogada.");
  return { user: { id: decoded.uid, email: decoded.email }, profile };
}
export async function establishSession(idToken: string) {
  const decoded = await auth().verifyIdToken(idToken, true);
  if (Date.now() / 1000 - decoded.auth_time > 300)
    throw new Error("Inicie sessão novamente.");
  const p = await firestore().doc(`profiles/${decoded.uid}`).get();
  const profile = assertAccess(
    p.exists ? ({ ...p.data(), id: p.id } as Profile) : undefined,
  );
  const expiresIn = 5 * 24 * 60 * 60 * 1000;
  const jwt = await auth().createSessionCookie(idToken, { expiresIn });
  const nonce = randomBytes(32).toString("hex");
  await firestore()
    .doc(`sessions/${sessionHash(nonce)}`)
    .set({
      uid: decoded.uid,
      version: profile.version,
      expires_at: Date.now() + expiresIn,
      expiresAt: Timestamp.fromMillis(Date.now() + expiresIn),
    });
  (await cookies()).set("__session", `${jwt}~${nonce}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn / 1000,
  });
}
export async function endSession() {
  const jar = await cookies();
  const nonce = jar.get("__session")?.value.split("~")[1];
  if (nonce && configured())
    await firestore()
      .doc(`sessions/${sessionHash(nonce)}`)
      .delete();
  jar.delete("__session");
}
export async function identityRequest(
  method: string,
  body: Record<string, unknown>,
) {
  if (!process.env.FIREBASE_WEB_API_KEY)
    throw new Error("Authentication ainda não está configurado.");
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST
    ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";
  const response = await fetch(
    `${host}/v1/accounts:${method}?key=${process.env.FIREBASE_WEB_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-Locale": "pt",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error?.message || "Falha de autenticação.");
  return result;
}
export async function sendAccessEmail(email: string) {
  return identityRequest("sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
    continueUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/login`,
  });
}
