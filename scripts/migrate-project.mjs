// Project-scoped migration. OAuth credentials are read from stdin, never persisted.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";

const source = "mychurch-kelsonflow";
const target = "project-b8361f5e-fc32-4291-b37";
const buckets = { source: `${source}-media`, target: `${target}-media` };
const task = process.argv[2];
if (
  ![
    "inventory",
    "copy-data",
    "verify-data",
    "copy-auth",
    "verify-auth",
  ].includes(task)
)
  throw new Error("Tarefa de migração inválida.");
const credentials = JSON.parse(readFileSync(0, "utf8"));
for (const key of ["sourceToken", "targetToken"])
  if (typeof credentials[key] !== "string" || credentials[key].length < 20)
    throw new Error("Credenciais temporárias necessárias.");
const project = (side) => (side === "source" ? source : target);
const headers = (side) => ({
  Authorization: `Bearer ${credentials[`${side}Token`]}`,
  "x-goog-user-project": project(side),
});
async function api(side, url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: {
      ...headers(side),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(
      `API ${response.status}: ${data.error?.message || "Falha"}`,
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
const root = (side) =>
  `projects/${project(side)}/databases/(default)/documents`;
const db = (side) => `https://firestore.googleapis.com/v1/${root(side)}`;
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const digest = (value) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
const ephemeral = new Set(["sessions", "rate_limits"]);
async function documents(side) {
  const result = new Map();
  async function walk(parent = "") {
    let pageToken;
    do {
      const list = await api(
        side,
        `${db(side)}${parent ? `/${parent}` : ""}:listCollectionIds`,
        "POST",
        { pageSize: 100, ...(pageToken ? { pageToken } : {}) },
      );
      for (const collection of list.collectionIds || []) {
        if (!parent && ephemeral.has(collection)) continue;
        const path = parent ? `${parent}/${collection}` : collection;
        let docsToken;
        do {
          const page = await api(
            side,
            `${db(side)}/${path}?pageSize=1000${docsToken ? `&pageToken=${encodeURIComponent(docsToken)}` : ""}`,
          );
          for (const document of page.documents || []) {
            const relative = document.name.slice(root(side).length + 1);
            result.set(relative, document);
            await walk(relative);
          }
          docsToken = page.nextPageToken;
        } while (docsToken);
      }
      pageToken = list.nextPageToken;
    } while (pageToken);
  }
  await walk();
  return result;
}
function remap(value) {
  if (Array.isArray(value)) return value.map(remap);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "referenceValue" &&
      typeof item === "string" &&
      item.startsWith(root("source"))
        ? root("target") + item.slice(root("source").length)
        : remap(item),
    ]),
  );
}
async function objects(side) {
  const result = new Map();
  let pageToken;
  do {
    const page = await api(
      side,
      `https://storage.googleapis.com/storage/v1/b/${buckets[side]}/o?maxResults=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`,
    );
    for (const object of page.items || []) result.set(object.name, object);
    pageToken = page.nextPageToken;
  } while (pageToken);
  return result;
}
async function users(side) {
  const result = [];
  let pageToken;
  do {
    const page = await api(
      side,
      `https://identitytoolkit.googleapis.com/v1/projects/${project(side)}/accounts:batchGet?maxResults=1000${pageToken ? `&nextPageToken=${encodeURIComponent(pageToken)}` : ""}`,
    );
    result.push(...(page.users || []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return result;
}
mkdirSync(".firebase/migration", { recursive: true });
const manifestPath = ".firebase/migration/church-manifest.json";
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : { source, target, documents: {}, objects: {}, users: {} };
if (manifest.source !== source || manifest.target !== target)
  throw new Error("Manifesto pertence a outros projetos.");
const persist = () =>
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
if (["inventory", "copy-data", "verify-data"].includes(task)) {
  const sourceDocs = await documents("source");
  const targetDocs = await documents("target");
  const sourceObjects = await objects("source");
  const targetObjects = await objects("target");
  const counts = {};
  for (const key of sourceDocs.keys())
    counts[key.split("/")[0]] = (counts[key.split("/")[0]] || 0) + 1;
  console.log(
    JSON.stringify({
      sourceDocuments: sourceDocs.size,
      targetDocuments: targetDocs.size,
      collections: counts,
      sourceObjects: sourceObjects.size,
      targetObjects: targetObjects.size,
    }),
  );
  if (task === "copy-data") {
    // Validate all document conflicts before the first write.
    const writes = [];
    for (const [path, document] of sourceDocs) {
      const fields = remap(document.fields || {});
      const existing = targetDocs.get(path);
      if (existing && digest(existing.fields || {}) === digest(fields))
        continue;
      if (
        existing &&
        manifest.documents[path]?.updateTime !== existing.updateTime
      )
        throw new Error(`Conflito no destino: ${path}`);
      writes.push({
        update: { name: `${root("target")}/${path}`, fields },
        currentDocument: existing
          ? { updateTime: existing.updateTime }
          : { exists: false },
      });
    }
    for (let offset = 0; offset < writes.length; offset += 200) {
      const batch = writes.slice(offset, offset + 200);
      const committed = await api("target", `${db("target")}:commit`, "POST", {
        writes: batch,
      });
      batch.forEach((write, index) => {
        manifest.documents[write.update.name.slice(root("target").length + 1)] =
          {
            updateTime: committed.writeResults[index].updateTime,
            hash: digest(write.update.fields),
          };
      });
      persist();
    }
    for (const [name, object] of sourceObjects) {
      const existing = targetObjects.get(name);
      if (
        existing?.md5Hash &&
        existing.md5Hash === object.md5Hash &&
        existing.size === object.size
      )
        continue;
      if (
        existing &&
        manifest.objects[name]?.generation !== existing.generation
      )
        throw new Error(`Objeto divergente no destino: ${name}`);
      const downloaded = await fetch(
        `https://storage.googleapis.com/storage/v1/b/${buckets.source}/o/${encodeURIComponent(name)}?alt=media&generation=${object.generation}`,
        { headers: headers("source") },
      );
      if (!downloaded.ok)
        throw new Error(`Não foi possível ler o objeto ${name}`);
      const bytes = Buffer.from(await downloaded.arrayBuffer());
      if (createHash("md5").update(bytes).digest("base64") !== object.md5Hash)
        throw new Error(`Integridade do objeto falhou: ${name}`);
      const boundary = `migration-${randomUUID()}`;
      const metadata = {
        name,
        contentType: object.contentType,
        cacheControl: object.cacheControl || "private, no-store",
        ...(object.metadata ? { metadata: object.metadata } : {}),
      };
      const body = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${object.contentType || "application/octet-stream"}\r\n\r\n`,
        ),
        bytes,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);
      const response = await fetch(
        `https://storage.googleapis.com/upload/storage/v1/b/${buckets.target}/o?uploadType=multipart&ifGenerationMatch=${existing?.generation || "0"}`,
        {
          method: "POST",
          headers: {
            ...headers("target"),
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body,
        },
      );
      const uploaded = await response.json();
      if (!response.ok || uploaded.md5Hash !== object.md5Hash)
        throw new Error(
          `Cópia do objeto falhou: ${name} (HTTP ${response.status})`,
        );
      manifest.objects[name] = {
        generation: uploaded.generation,
        md5Hash: uploaded.md5Hash,
      };
      persist();
    }
    console.log(
      `Copiados ${writes.length} documentos; imagens copiadas ou verificadas: ${sourceObjects.size}.`,
    );
  }
  if (task === "verify-data") {
    if (
      sourceDocs.size !== targetDocs.size ||
      sourceObjects.size !== targetObjects.size
    )
      throw new Error("Contagens dos dados divergem.");
    for (const [path, document] of sourceDocs)
      if (
        digest(remap(document.fields || {})) !==
        digest(targetDocs.get(path)?.fields || {})
      )
        throw new Error(`Documento diferente: ${path}`);
    for (const [name, object] of sourceObjects)
      if (
        !object.md5Hash ||
        object.md5Hash !== targetObjects.get(name)?.md5Hash ||
        object.size !== targetObjects.get(name)?.size
      )
        throw new Error(`Imagem diferente: ${name}`);
    console.log(
      "Todos os documentos persistentes e checksums das imagens coincidem.",
    );
  }
}
if (["copy-auth", "verify-auth"].includes(task)) {
  const original = await users("source");
  const current = await users("target");
  if (task === "copy-auth") {
    const configuration = await api(
      "source",
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${source}/config`,
    );
    const hash = configuration.signIn.hashConfig;
    if (hash?.algorithm !== "SCRYPT" || !hash.signerKey)
      throw new Error("Parâmetros de hash da origem indisponíveis.");
    const fields = [
      "localId",
      "email",
      "emailVerified",
      "passwordHash",
      "salt",
      "displayName",
      "photoUrl",
      "disabled",
      "createdAt",
      "lastLoginAt",
      "validSince",
      "providerUserInfo",
      "customAttributes",
      "phoneNumber",
      "mfaInfo",
    ];
    const imported = original.filter(
      (user) => !current.some((other) => other.localId === user.localId),
    );
    for (const user of original)
      if (
        current.some(
          (other) =>
            (other.localId === user.localId && other.email !== user.email) ||
            (other.email === user.email && other.localId !== user.localId),
        )
      )
        throw new Error("Conflito de identidade no destino.");
    for (let offset = 0; offset < imported.length; offset += 1000) {
      const batch = imported
        .slice(offset, offset + 1000)
        .map((user) =>
          Object.fromEntries(
            fields
              .filter((key) => user[key] !== undefined)
              .map((key) => [key, user[key]]),
          ),
        );
      const result = await api(
        "target",
        `https://identitytoolkit.googleapis.com/v1/projects/${target}/accounts:batchCreate`,
        "POST",
        {
          hashAlgorithm: "SCRYPT",
          signerKey: hash.signerKey,
          saltSeparator: hash.saltSeparator,
          rounds: hash.rounds,
          memoryCost: hash.memoryCost,
          allowOverwrite: false,
          users: batch,
        },
      );
      if (result.error?.length)
        throw new Error(
          `Falharam ${result.error.length} contas na importação.`,
        );
      for (const user of batch)
        manifest.users[user.localId] = { fingerprint: digest(user) };
      persist();
    }
    console.log(
      `Contas importadas: ${imported.length}; UIDs preservados; palavras-passe importadas com SCRYPT.`,
    );
  } else {
    if (original.length !== current.length)
      throw new Error("Contagens Authentication divergem.");
    for (const user of original) {
      const match = current.find((other) => other.localId === user.localId);
      if (
        !match ||
        match.email !== user.email ||
        Boolean(match.disabled) !== Boolean(user.disabled) ||
        Boolean(match.emailVerified) !== Boolean(user.emailVerified)
      )
        throw new Error("Atributos Authentication divergentes.");
      if (user.passwordHash && !match.passwordHash)
        throw new Error("Uma palavra-passe não foi importada.");
      if (
        user.passwordHash &&
        (match.passwordHash !== user.passwordHash || match.salt !== user.salt)
      )
        throw new Error(
          "A palavra-passe de uma conta diverge da cópia de origem; não concluir a transição.",
        );
    }
    console.log(`Verificadas ${original.length} identidades Authentication.`);
  }
}
