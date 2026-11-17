import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
test("PostgreSQL RLS, role boundaries, live session revocation, history and last administrator", async (t) => {
  const pg = new PGlite({ extensions: { pgcrypto } });
  t.after(() => pg.close());
  await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);create table auth.sessions(id uuid primary key,user_id uuid references auth.users);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to anon,authenticated;
 grant select,insert,delete on storage.objects to anon,authenticated;`);
  await pg.exec(
    await readFile(
      new URL("../supabase/migrations/001_initial.sql", import.meta.url),
      "utf8",
    ),
  );
  const admin = "00000000-0000-0000-0000-000000000001",
    editor = "00000000-0000-0000-0000-000000000002";
  const adminSession = "10000000-0000-0000-0000-000000000001",
    editorSession = "10000000-0000-0000-0000-000000000002";
  await pg.exec(
    `insert into auth.users values('${admin}'),('${editor}');insert into auth.sessions values('${adminSession}','${admin}'),('${editorSession}','${editor}');insert into profiles(id,email,role) values('${admin}','a@example.test','admin'),('${editor}','e@example.test','editor');insert into content(kind,slug,title,status) values('page','private-draft','Private draft','draft'),('page','public-page','Public page','published');insert into messages(name,email,subject,message) values('Test','test@example.test','Subject','Private message');`,
  );
  async function as(role: string, id = "", session = "") {
    await pg.exec(
      `reset role;set role ${role};select set_config('request.jwt.claim.sub','${id}',false);select set_config('request.jwt.claims','${JSON.stringify({ session_id: session })}',false);`,
    );
  }
  async function invisible(sql: string) {
    try {
      assert.equal((await pg.query(sql)).rows.length, 0);
    } catch (e: any) {
      if (e.code !== "42501") throw e;
    }
  }
  await as("anon");
  assert.equal((await pg.query("select * from content")).rows.length, 1);
  await invisible("select * from messages");
  await invisible("select * from revisions");
  await assert.rejects(
    pg.exec(
      `insert into content(kind,slug,title) values('page','illegal','Illegal')`,
    ),
  );
  await as("authenticated", editor, editorSession);
  assert.equal((await pg.query("select * from content")).rows.length, 2);
  await pg.exec(
    `update content set title='Edited',status='published' where slug='private-draft'`,
  );
  assert.equal((await pg.query("select * from revisions")).rows.length, 1);
  assert.equal(
    (
      await pg.query(
        `update profiles set role='admin' where id='${editor}' returning id`,
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (await pg.query(`update settings set data='{}' returning id`)).rows.length,
    0,
  );
  await assert.rejects(
    pg.exec(
      `insert into profiles(id,email,role) values(gen_random_uuid(),'x@example.test','admin')`,
    ),
  );
  await as("authenticated", admin, adminSession);
  await assert.rejects(
    pg.exec(`update profiles set status='suspended' where id='${admin}'`),
    /último administrador/,
  );
  await assert.rejects(
    pg.exec(`delete from profiles where id='${admin}'`),
    /último administrador/,
  );
  await pg.exec(`update profiles set status='suspended' where id='${editor}'`);
  await as("authenticated", editor, editorSession);
  assert.equal(
    (await pg.query<{ ok: boolean }>("select public.is_staff() as ok")).rows[0]
      .ok,
    false,
  );
  assert.equal(
    (await pg.query(`update content set title='Unauthorized' returning id`))
      .rows.length,
    0,
  );
  await assert.rejects(
    pg.exec(
      `insert into content(kind,slug,title) values('page','blocked','Blocked')`,
    ),
  );
  await as("authenticated", admin, adminSession);
  await pg.exec(`select restore_revision(1)`);
  assert.equal(
    (
      await pg.query<{ status: string }>(
        `select status from content where slug='private-draft'`,
      )
    ).rows[0].status,
    "draft",
  );
  await as("anon");
  assert.equal(
    (await pg.query(`select * from content where slug='private-draft'`)).rows
      .length,
    0,
  );
  await as("postgres");
  const imageId = "20000000-0000-0000-0000-000000000001";
  await pg.exec(
    `insert into media(id,alt) values('${imageId}','Private photo');insert into storage.objects(bucket_id,name) values('media','${imageId}/large.webp');insert into content(kind,slug,title,status,data) values('album','private-album','Private album','draft','{"images":[{"image":"${imageId}"}]}');`,
  );
  await as("anon");
  assert.equal((await pg.query("select * from media")).rows.length, 0);
  assert.equal(
    (await pg.query("select * from storage.objects")).rows.length,
    0,
  );
  await as("authenticated", admin, adminSession);
  await pg.exec(
    `update content set status='published' where slug='private-album'`,
  );
  await as("anon");
  assert.equal((await pg.query("select * from media")).rows.length, 1);
  assert.equal(
    (await pg.query("select * from storage.objects")).rows.length,
    1,
  );
  await as("authenticated", admin, adminSession);
  await assert.rejects(
    pg.exec(`delete from media where id='${imageId}'`),
    /utilização/,
  );
  await as("anon");
  await assert.rejects(
    pg.exec(
      `select submit_message('Name','test@example.test','Subject','Long enough message','test-key')`,
    ),
  );
  await as("service_role");
  for (let i = 0; i < 4; i++)
    await pg.query(
      `select submit_message('Name','test@example.test','Subject','Long enough message','test-key')`,
    );
  await assert.rejects(
    pg.query(
      `select submit_message('Name','test@example.test','Subject','Long enough message','test-key')`,
    ),
    /Limite/,
  );
  await as("postgres");
  await assert.rejects(
    pg.exec(
      `insert into content(kind,slug,title,data) values('event','invalid-event','Invalid event','{"start":"2026-12-12T12:00","end":"2026-12-11T12:00","eventState":"scheduled"}')`,
    ),
  );
});
