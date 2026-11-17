import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, getBytes, uploadBytes } from "firebase/storage";
import { spawn } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
test(
  "The production server accepts a Firebase session and immediately rejects it after suspension",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async (t) => {
    process.env.FIREBASE_PROJECT_ID = "demo-mychurch";
    const { auth, firestore } = await import("../src/lib/firebase-admin");
    const { writeProfile } = await import("../src/lib/store");
    const password = randomBytes(24).toString("hex");
    const email = `session-${Date.now()}@example.test`;
    const user = await auth().createUser({ email, password });
    await writeProfile(
      { id: user.uid, email, role: "editor", status: "active" },
      "fixture",
    );
    const r = await fetch(
      `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );
    const tokens = await r.json();
    assert.ok(tokens.idToken);
    const jwt = await auth().createSessionCookie(tokens.idToken, {
      expiresIn: 3600000,
    });
    const nonce = randomBytes(32).toString("hex");
    await firestore()
      .doc(`sessions/${createHash("sha256").update(nonce).digest("hex")}`)
      .set({ uid: user.uid, version: 1, expires_at: Date.now() + 3600000 });
    const server = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--port", "3012"],
      {
        env: { ...process.env, PORT: "3012" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let logs = "";
    server.stdout.on("data", (v) => (logs += v));
    server.stderr.on("data", (v) => (logs += v));
    t.after(() => {
      server.kill();
    });
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        const health = await fetch("http://localhost:3012/");
        if (health.status === 200) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(ready, logs.slice(-3000));
    const get = (path: string, cookie?: string) =>
      fetch(`http://localhost:3012${path}`, {
        redirect: "manual",
        headers: cookie ? { cookie } : undefined,
      });
    const cookie = `__session=${jwt}~${nonce}`;
    assert.equal((await get("/admin")).status, 307);
    const active = await get("/admin", cookie);
    assert.equal(active.status, 200, (await active.text()).slice(0, 200));
    const adminOnly = await get("/admin/utilizadores", cookie);
    assert.equal(adminOnly.status, 307);
    assert.equal(adminOnly.headers.get("location"), "/admin");
    await writeProfile(
      { id: user.uid, email, role: "editor", status: "suspended" },
      "fixture",
    );
    const revoked = await get("/admin", cookie);
    assert.equal(revoked.status, 307);
    assert.equal(revoked.headers.get("location"), "/admin/login");
  },
);
test(
  "Firestore and Storage deny direct writes and protect private editorial data",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async (t) => {
    const env = await initializeTestEnvironment({
      projectId: "demo-mychurch",
      firestore: { rules: await readFile("firestore.rules", "utf8") },
      storage: { rules: await readFile("storage.rules", "utf8") },
    });
    t.after(() => env.cleanup());
    await env.withSecurityRulesDisabled(async (c) => {
      const db = c.firestore();
      await setDoc(doc(db, "profiles/admin"), {
        role: "admin",
        status: "active",
      });
      await setDoc(doc(db, "profiles/editor"), {
        role: "editor",
        status: "active",
      });
      await setDoc(doc(db, "content/public"), { status: "published" });
      await setDoc(doc(db, "content/draft"), { status: "draft" });
      await setDoc(doc(db, "messages/private"), { message: "Private message" });
      await uploadBytes(
        ref(c.storage(), "media/private/large.webp"),
        new Uint8Array([1, 2, 3]),
      );
    });
    const anon = env.unauthenticatedContext();
    const editor = env.authenticatedContext("editor");
    const admin = env.authenticatedContext("admin");
    await assertSucceeds(getDoc(doc(anon.firestore(), "content/public")));
    await assertFails(getDoc(doc(anon.firestore(), "content/draft")));
    await assertFails(getDoc(doc(anon.firestore(), "messages/private")));
    await assertSucceeds(getDoc(doc(editor.firestore(), "content/draft")));
    await assertFails(
      setDoc(doc(editor.firestore(), "profiles/editor"), {
        role: "admin",
        status: "active",
      }),
    );
    await assertFails(
      setDoc(doc(admin.firestore(), "content/public"), { status: "published" }),
    );
    await assertFails(
      uploadBytes(
        ref(editor.storage(), "media/bypass.webp"),
        new Uint8Array([1]),
      ),
    );
    await assertFails(
      getBytes(ref(anon.storage(), "media/private/large.webp")),
    );
    await env.withSecurityRulesDisabled((c) =>
      updateDoc(doc(c.firestore(), "profiles/editor"), { status: "suspended" }),
    );
    await assertFails(getDoc(doc(editor.firestore(), "content/draft")));
  },
);
test(
  "Firebase transactions protect the last administrator, history and publication references",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    process.env.FIREBASE_PROJECT_ID = "demo-mychurch";
    const {
      writeProfile,
      writeContent,
      restoreContent,
      listRecords,
      rateLimit,
    } = await import("../src/lib/store");
    const { firestore } = await import("../src/lib/firebase-admin");
    const { randomUUID } = await import("node:crypto");
    await writeProfile(
      {
        id: "owner",
        email: "owner@example.test",
        role: "admin",
        status: "active",
      },
      "setup",
      false,
      true,
    );
    await assert.rejects(
      writeProfile(
        {
          id: "owner",
          email: "owner@example.test",
          role: "admin",
          status: "suspended",
        },
        "owner",
      ),
      /último administrador/,
    );
    const id = await writeContent(
      {
        kind: "page",
        slug: "transaction-test",
        title: "First version",
        status: "draft",
        data: {},
      },
      "owner",
    );
    await writeContent(
      {
        kind: "page",
        slug: "transaction-test",
        title: "Second version",
        status: "published",
        data: {},
      },
      "owner",
      id,
    );
    const revisions = await listRecords<any>("revisions");
    const revision = revisions.find((r) => r.content_id === id);
    assert.ok(revision);
    await restoreContent(revision.id, "owner");
    assert.equal(
      (await firestore().doc(`content/${id}`).get()).get("status"),
      "draft",
    );
    const key = randomUUID();
    for (let i = 0; i < 4; i++) await rateLimit(key, 4, 3600000);
    await assert.rejects(rateLimit(key, 4, 3600000), /Limite/);
  },
);
