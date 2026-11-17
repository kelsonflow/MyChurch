import { auth, firestore } from "../src/lib/firebase-admin";
import type { UserRecord } from "firebase-admin/auth";
async function main() {
  const emails = process.argv.slice(2);
  if (
    !emails.length ||
    emails.some((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
  )
    throw new Error("Indique os emails dos primeiros administradores.");
  const db = firestore();
  const lock = db.doc("system/access");
  const before = await lock.get();
  if (before.get("admins")?.length)
    throw new Error("Já existe um administrador. Use os convites do painel.");
  const users: UserRecord[] = [];
  try {
    for (const email of emails) users.push(await auth().createUser({ email }));
    await db.runTransaction(async (tx) => {
      const s = await tx.get(lock);
      if (s.get("admins")?.length)
        throw new Error("Já existe um administrador.");
      tx.set(lock, { admins: users.map((u) => u.uid) });
      for (const user of users)
        tx.create(db.doc(`profiles/${user.uid}`), {
          email: user.email,
          role: "admin",
          status: "active",
          version: 1,
          created_at: new Date().toISOString(),
        });
    });
  } catch (e) {
    await Promise.all(users.map((u) => auth().deleteUser(u.uid)));
    throw e;
  }
  for (const user of users) {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "PASSWORD_RESET",
          email: user.email,
          continueUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/login`,
        }),
      },
    );
    if (!response.ok)
      throw new Error(
        `O acesso de ${user.email} foi criado, mas o email não pôde ser enviado. Use a recuperação de acesso.`,
      );
    await db
      .doc(`profiles/${user.uid}`)
      .update({ invite_email_sent_at: new Date().toISOString() });
    console.log(`Convite enviado para ${user.email}.`);
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
