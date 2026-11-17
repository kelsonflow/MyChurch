import type { Content } from "./model";
export function ical(c: Content, base: string) {
  const esc = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  const stamp = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const fold = (line: string) => {
    let out = "";
    let count = 0;
    for (const ch of line) {
      const size = Buffer.byteLength(ch);
      if (count + size > 73) {
        out += "\r\n ";
        count = 1;
      }
      out += ch;
      count += size;
    }
    return out;
  };
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Missao aos Povos//Agenda//PT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${esc(c.id)}@missao-aos-povos`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(c.starts_at || c.data.start)}`,
    `DTEND:${stamp(c.ends_at || c.data.end)}`,
    `SUMMARY:${esc((c.data.demo ? "[DEMONSTRAÇÃO] " : "") + c.title)}`,
    `DESCRIPTION:${esc(c.data.body || "")}`,
    `LOCATION:${esc(c.data.location || "A confirmar")}`,
    `URL:${base}/agenda/${c.slug}`,
    `STATUS:${c.data.eventState === "cancelled" ? "CANCELLED" : c.data.eventState === "postponed" ? "TENTATIVE" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n");
}
