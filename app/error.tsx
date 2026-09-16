"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-state"><span className="section-index">SYSTEM / RECOVERY</span><h1>The arena lost the signal.</h1><p>Your data is safe. Try this view again; if the API is unavailable, Arena will preserve the last confirmed state.</p><button className="primary-cta" onClick={reset}><RotateCcw /> Try again</button><Link href="/">Return to the public tournament</Link></main>;
}
