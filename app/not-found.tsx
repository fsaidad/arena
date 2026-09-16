import Link from "next/link";

export default function NotFound() {
  return <main className="error-state"><span className="section-index">404 / OUT OF BRACKET</span><h1>This page isn’t in the draw.</h1><p>The tournament or match may have moved. Return to Arena’s current live event.</p><Link className="primary-cta" href="/">Open live tournament</Link></main>;
}
