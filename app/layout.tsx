import type { Metadata } from "next";

import { siteUrl } from "@/shared/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Arena — Live tournaments, perfectly in sync",
  description: "Run competitive tournaments and follow every match live. Explore the Arena product demo.",
  alternates: { canonical: "/" },
  openGraph: { title: "Arena — Live tournaments, perfectly in sync", description: "Run brackets, publish results, and keep every spectator in sync.", type: "website" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
