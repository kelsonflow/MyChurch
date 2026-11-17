import type { Metadata } from "next";
import { settings } from "@/lib/content";
import "./globals.css";
const baseMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Missão aos Povos · Uma igreja de portas abertas",
    template: "%s | Missão aos Povos",
  },
  description:
    "Uma igreja que ama, cuida e partilha. Conheça a Assembleia de Deus — Missão aos Povos, em Portugal.",
  openGraph: {
    locale: "pt_PT",
    type: "website",
    siteName: "Missão aos Povos",
    images: [{ url: "/images/community.webp", width: 534, height: 400 }],
  },
};
export async function generateMetadata(): Promise<Metadata> {
  const s = await settings();
  return {
    ...baseMetadata,
    title: { default: s.name, template: `%s | ${s.name}` },
    description: s.seoDescription,
    icons: {
      icon: [
        {
          url: `/api/brand-icon?v=${encodeURIComponent(s.logo || "default")}&size=64`,
          type: "image/png",
          sizes: "64x64",
        },
      ],
      apple: [
        {
          url: `/api/brand-icon?v=${encodeURIComponent(s.logo || "default")}&size=180`,
          type: "image/png",
          sizes: "180x180",
        },
      ],
    },
    openGraph: {
      ...baseMetadata.openGraph,
      description: s.seoDescription,
      siteName: s.name,
    },
  };
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
