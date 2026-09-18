import type { Metadata } from "next";

import { siteUrl } from "@/shared/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Arena — Northern Circuit Live",
  description: "Live scores, schedules, brackets, and tournament operations for the Northern Circuit Invitational.",
  alternates: { canonical: "/" },
  openGraph: { title: "Arena — Northern Circuit Live", description: "Follow live scores, schedules, and the playoff bracket in real time.", type: "website" },
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
