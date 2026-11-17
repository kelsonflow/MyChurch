// Trusted local maintenance through official REST APIs and short-lived OAuth.
// Read the token on stdin; never persist or print it. Production uses managed IAM.
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
const [task, ...args] = process.argv.slice(2);
if (!["seed", "bootstrap"].includes(task))
  throw new Error("Tarefa permitida: seed ou bootstrap.");
const project = process.env.FIREBASE_PROJECT_ID;
if (!project) throw new Error("Defina FIREBASE_PROJECT_ID.");
const token = readFileSync(0, "utf8").trim();
if (token.length < 20 || token.length > 10000)
  throw new Error("Token OAuth temporário inválido.");
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
const name = `projects/${project}/databases/(default)/documents`;
async function api(url, method = "GET", body) {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": project,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  if (!r.ok) {
    const error = new Error(data.error?.message || `API ${r.status}`);
    error.status = r.status;
    throw error;
  }
  return data;
}
function value(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number")
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(value) } };
  return { mapValue: { fields: fields(v) } };
}
function fields(o) {
  return Object.fromEntries(
    Object.entries(o)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, value(v)]),
  );
}
function write(path, data, exists = false) {
  return {
    update: { name: `${name}/${path}`, fields: fields(data) },
    currentDocument: { exists },
  };
}
if (task === "seed") {
  const existing = await api(`${base}/content?pageSize=1`);
  if (existing.documents?.length)
    throw new Error(
      "Já existem conteúdos. O seed não substitui trabalho editorial.",
    );
  const { demoContent, defaultSettings } = await import("../src/lib/demo.ts");
  const { contentSchema, lisbonToUtc } = await import("../src/lib/model.ts");
  const writes = [];
  for (const c of demoContent) {
    const record = contentSchema.parse(c);
    const id = randomUUID();
    writes.push(
      write(`content/${id}`, {
        ...record,
        starts_at: c.kind === "event" ? lisbonToUtc(c.data.start) : null,
        ends_at: c.kind === "event" ? lisbonToUtc(c.data.end) : null,
        updated_at: new Date().toISOString(),
        updated_by: "bootstrap",
      }),
    );
    writes.push(write(`slugs/${c.kind}-${c.slug}`, { id }));
  }
  writes.push(write("settings/general", { data: defaultSettings }));
  await api(`${base}:commit`, "POST", { writes });
  console.log("Conteúdos de demonstração inicializados no Firestore.");
}
if (task === "bootstrap") {
  if (!args.length || args.some((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)))
    throw new Error("Indique os emails dos administradores.");
  let lock;
  try {
    lock = await api(`${base}/system/access`);
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  if (lock?.fields?.admins?.arrayValue?.values?.length)
    throw new Error("Já existe um administrador. Use os convites do painel.");
  const config = JSON.parse(readFileSync(".firebase/runtime-env.json", "utf8"));
  const users = [];
  try {
    for (const email of args) {
      const created = await api(
        `https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts`,
        "POST",
        { email },
      );
      users.push({ uid: created.localId, email });
    }
    const writes = users.map((user) =>
      write(`profiles/${user.uid}`, {
        email: user.email,
        role: "admin",
        status: "active",
        version: 1,
        created_at: new Date().toISOString(),
      }),
    );
    const lockWrite = {
      update: {
        name: `${name}/system/access`,
        fields: fields({ admins: users.map((u) => u.uid) }),
      },
      currentDocument: lock
        ? { updateTime: lock.updateTime }
        : { exists: false },
    };
    writes.push(lockWrite);
    await api(`${base}:commit`, "POST", { writes });
  } catch (error) {
    for (const user of users)
      await api(
        `https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:delete`,
        "POST",
        { localId: user.uid },
      ).catch(() => {});
    throw error;
  }
  for (const user of users) {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${config.FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "PASSWORD_RESET",
          email: user.email,
          continueUrl: `${config.NEXT_PUBLIC_SITE_URL}/admin/login`,
        }),
      },
    );
    if (!r.ok) {
      const result = await r.json();
      throw new Error(
        `Acesso criado, mas o email para ${user.email} falhou: ${result.error?.message || r.status}`,
      );
    }
    await api(`${base}:commit`, "POST", {
      writes: [
        {
          update: {
            name: `${name}/profiles/${user.uid}`,
            fields: fields({ invite_email_sent_at: new Date().toISOString() }),
          },
          updateMask: { fieldPaths: ["invite_email_sent_at"] },
          currentDocument: { exists: true },
        },
      ],
    });
    console.log(`Convite de administrador enviado para ${user.email}.`);
  }
}
