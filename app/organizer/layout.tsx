import type { Metadata } from "next";

export const metadata: Metadata = { title: "Organizer workspace — Arena", robots: { index: false, follow: false } };

export default function OrganizerLayout({ children }: { children: React.ReactNode }) { return children; }
