import { test } from "node:test";
import assert from "node:assert/strict";
import { assertAccess, nextAdmins, type Profile } from "../src/lib/access";
const editor: Profile = {
  id: "e",
  email: "e@example.test",
  role: "editor",
  status: "active",
  version: 1,
  created_at: "",
};
test("Live membership enforces admin privileges and suspension", () => {
  assert.equal(assertAccess(editor).role, "editor");
  assert.throws(() => assertAccess(editor, true), /permissão/);
  assert.throws(
    () => assertAccess({ ...editor, status: "suspended" }),
    /permissão/,
  );
  assert.throws(() => assertAccess(undefined), /permissão/);
});
test("The last active administrator cannot be removed, suspended or demoted", () => {
  for (const [role, status, revoke] of [
    ["editor", "active", false],
    ["admin", "suspended", false],
    ["admin", "active", true],
  ] as const)
    assert.throws(
      () => nextAdmins(["a"], "a", role, status, revoke),
      /último administrador/,
    );
  assert.deepEqual(nextAdmins(["a", "b"], "a", "editor", "active"), ["b"]);
});
