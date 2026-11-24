import { test } from "node:test";
import assert from "node:assert/strict";
import {
  youtubeId,
  lisbonToUtc,
  contentSchema,
  eventIsUpcoming,
  type Content,
} from "../src/lib/model";
import { ical } from "../src/lib/ical";
import { limitedBody } from "../src/lib/request-body";
test("Request bodies stay bounded when Content-Length is absent or forged", async () => {
  const valid = new Request("http://localhost", {
    method: "POST",
    body: "hello",
  });
  assert.equal((await limitedBody(valid, 10)).toString(), "hello");
  const malicious = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Length": "1" },
    body: "x".repeat(32),
  });
  await assert.rejects(limitedBody(malicious, 16), /grande/);
});
test("YouTube accepts only HTTPS allowlisted hosts and eleven-character identifiers", () => {
  for (const url of [
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share",
    "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/live/dQw4w9WgXcQ?si=shared-link",
    "https://m.youtube.com/live/dQw4w9WgXcQ/",
  ])
    assert.equal(youtubeId(url), "dQw4w9WgXcQ");
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.evil.org/watch?v=dQw4w9WgXcQ",
    "http://youtu.be/dQw4w9WgXcQ",
    "https://youtu.be/short",
    "https://user@youtu.be/dQw4w9WgXcQ",
    "https://youtu.be:8443/dQw4w9WgXcQ",
    "https://www.youtube.com/live/short",
    "https://www.youtube.com/live/dQw4w9WgXcQ/extra",
  ])
    assert.equal(youtubeId(url), null);
});
test("YouTube accepts the live link reported by the church", () => {
  assert.equal(
    youtubeId("https://www.youtube.com/live/uSQKg2b1gL4?si=N52EkwXBWRNcYPYO"),
    "uSQKg2b1gL4",
  );
});
test("Lisbon editorial time observes DST and rejects nonexistent spring time", () => {
  assert.equal(lisbonToUtc("2026-01-10T10:00"), "2026-01-10T10:00:00.000Z");
  assert.equal(lisbonToUtc("2026-07-10T10:00"), "2026-07-10T09:00:00.000Z");
  assert.equal(lisbonToUtc("2026-03-29T01:30"), null);
  assert.equal(lisbonToUtc("not-a-date"), null);
});
test("Event end validation and automatic archive boundaries support multi-day events", () => {
  const event = {
    kind: "event",
    slug: "encontro",
    title: "Encontro",
    status: "draft",
    data: {
      start: "2026-12-12T18:00",
      end: "2026-12-13T12:00",
      eventState: "scheduled",
    },
  };
  assert.equal(contentSchema.safeParse(event).success, true);
  assert.equal(
    contentSchema.safeParse({
      ...event,
      data: { ...event.data, end: "2026-12-11T12:00" },
    }).success,
    false,
  );
  const c = {
    ...event,
    id: "test",
    updated_at: "2026-11-17T00:00:00Z",
    ends_at: "2026-12-13T12:00:00Z",
  } as Content;
  assert.equal(eventIsUpcoming(c, new Date("2026-12-13T11:59:00Z")), true);
  assert.equal(eventIsUpcoming(c, new Date("2026-12-13T12:00:01Z")), false);
});
test("Calendar escapes untrusted fields, uses UTC, folds UTF-8 and has no injected properties", () => {
  const c = {
    id: "test",
    kind: "event",
    status: "published",
    updated_at: "2026-11-17T00:00:00Z",
    slug: "encontro",
    title: "Oração, fé; amor\nBEGIN:ATTACK",
    data: {
      body: "Fé e partilha ".repeat(20),
      location: "Sintra",
      eventState: "scheduled",
    },
    starts_at: "2026-07-10T09:00:00Z",
    ends_at: "2026-07-11T09:00:00Z",
  } as Content;
  const result = ical(c, "https://example.org");
  assert.match(result, /DTSTART:20260710T090000Z/);
  assert.match(result, /SUMMARY:Oração\\, fé\\; amor\\nBEGIN:ATTACK/);
  assert.equal(result.includes("\r\nBEGIN:ATTACK"), false);
  for (const line of result.split("\r\n"))
    assert.ok(Buffer.byteLength(line) <= 75);
});
