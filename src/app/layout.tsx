import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import { SITE_URL } from "@/lib/constants";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ХЭТ — Шинэ үеийн стиль",
    template: "%s | ХЭТ",
  },
  description:
    "Залуусын өдөр тутмын, streetwear болон premium casual хувцасны онлайн дэлгүүр.",
  openGraph: {
    type: "website",
    siteName: "ХЭТ",
    locale: "mn_MN",
    url: SITE_URL,
    title: "ХЭТ — Шинэ үеийн стиль",
    description:
      "Залуусын өдөр тутмын, streetwear болон premium casual хувцасны онлайн дэлгүүр.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ХЭТ — Шинэ үеийн стиль",
    description:
      "Залуусын өдөр тутмын, streetwear болон premium casual хувцасны онлайн дэлгүүр.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={`${inter.variable} ${unbounded.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
