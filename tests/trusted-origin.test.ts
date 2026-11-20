import { test } from "node:test";
import assert from "node:assert/strict";
import { trustedOrigin } from "../src/lib/trusted-origin";

test("contact and upload origins accept church hosts and reject forged origins", () => {
  const previousProject = process.env.FIREBASE_PROJECT_ID;
  const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.FIREBASE_PROJECT_ID = "project-b8361f5e-fc32-4291-b37";
    process.env.NEXT_PUBLIC_SITE_URL =
      "https://project-b8361f5e-fc32-4291-b37.web.app";
    assert.equal(trustedOrigin("https://adportugal.pt"), true);
    assert.equal(
      trustedOrigin("https://project-b8361f5e-fc32-4291-b37.web.app"),
      true,
    );
    for (const origin of [
      null,
      "null",
      "http://adportugal.pt",
      "https://adportugal.pt.evil.example",
      "https://adportugal.pt:8443",
    ]) {
      assert.equal(trustedOrigin(origin), false);
    }
    process.env.FIREBASE_PROJECT_ID = "another-project";
    assert.equal(trustedOrigin("https://adportugal.pt"), false);
  } finally {
    if (previousProject === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = previousProject;
    if (previousSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSite;
  }
});
