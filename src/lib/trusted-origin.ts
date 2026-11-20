// Explicit public entry points; never trust a caller-supplied Host header.
export function trustedOrigin(origin: string | null) {
  const allowed = new Set([
    new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").origin,
  ]);
  if (process.env.FIREBASE_PROJECT_ID === "project-b8361f5e-fc32-4291-b37") {
    allowed.add("https://adportugal.pt");
    allowed.add("https://www.adportugal.pt");
    allowed.add("https://project-b8361f5e-fc32-4291-b37.web.app");
    allowed.add("https://project-b8361f5e-fc32-4291-b37.firebaseapp.com");
    allowed.add("https://mychurch-216062947807.europe-west4.run.app");
  }
  return origin !== null && allowed.has(origin);
}
