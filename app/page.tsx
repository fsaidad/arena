"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowRight, Brackets, ChevronRight, CircleDot, Code2, Moon, Radio, ShieldCheck, Sun, Trophy, Users, WifiOff, X } from "lucide-react";

const rounds = [
  { label: "Upper semifinal", time: "18:00", teams: [{ name: "Northstar", seed: "01", score: 12, winner: false }, { name: "Black Kite", seed: "04", score: 13, winner: true }] },
  { label: "Upper semifinal", time: "20:30", teams: [{ name: "Redline", seed: "02", score: 9, winner: false }, { name: "Morrow", seed: "03", score: 13, winner: true }] },
];

const activity = [
  ["Round 21", "Black Kite secured B site", "just now"],
  ["Round 20", "Northstar called a tactical timeout", "2m"],
  ["Round 19", "Fable won a 1v2 clutch", "4m"],
];

export default function Home() {
  const [dark, setDark] = useState(false);
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(true);
  const [score, setScore] = useState(11);
  const [round, setRound] = useState(21);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!connected) return;
      setRound((value) => value + 1);
      setScore((value) => (value >= 12 ? 11 : value + 1));
    }, 7000);
    return () => window.clearInterval(timer);
  }, [connected]);

  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  const jumpToLive = () => document.getElementById("live")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main>
      <a className="skip-link" href="#live">Skip to live match</a>
      {!connected && <div className="connection-banner" role="status"><WifiOff size={15} />Live connection lost. Showing the last confirmed state.<button onClick={() => setConnected(true)}>Reconnect</button></div>}
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Arena home"><span className="brand-mark"><span /></span>ARENA</a>
        <nav aria-label="Primary navigation"><a href="#tournaments">Tournaments</a><a href="#live">Live</a><a href="#architecture">Architecture</a></nav>
        <div className="header-actions"><button className="icon-button" onClick={() => setDark(!dark)} aria-label={`Use ${dark ? "light" : "dark"} theme`}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="text-button" onClick={() => setJoined(true)}>Enter demo</button></div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><Radio size={14} /> LIVE TOURNAMENT OPERATIONS</div>
        <h1>Every match.<br /><em>One live arena.</em></h1>
        <p className="hero-copy">Run brackets, publish results, and keep every spectator in sync—from first check-in to the final round.</p>
        <div className="hero-actions"><button className="primary-cta" onClick={jumpToLive}>Open live tournament <ArrowRight size={18} /></button><a href="#architecture" className="secondary-link">View architecture <ChevronRight size={16} /></a></div>
        <div className="hero-rail" aria-label="Tournament status summary"><div><strong>24</strong><span>TEAMS CHECKED IN</span></div><div><strong>6</strong><span>MATCHES LIVE</span></div><div><strong>184</strong><span>SPECTATORS ONLINE</span></div><div className="rail-status"><CircleDot size={16} /><span>ALL SYSTEMS<br />SYNCHRONIZED</span></div></div>
      </section>

      <section className="live-section" id="live" aria-labelledby="live-title">
        <div className="section-heading"><div><span className="section-index">01 / LIVE</span><h2 id="live-title">Northern Circuit Invitational</h2><p>Counter-Strike 2 · Double elimination · September 17–19</p></div><span className={`sync-state ${connected ? "is-live" : "is-stale"}`}>{connected ? <Activity size={15} /> : <WifiOff size={15} />}{connected ? "Live · synced" : "Reconnecting"}</span></div>
        <div className="broadcast-grid">
          <article className="scoreboard" aria-label="Live match score">
            <div className="match-meta"><span>UPPER FINAL</span><span>BEST OF 3 · MAP 2</span></div>
            <div className="team-row"><div className="team-name"><span className="team-glyph kite">BK</span><div><strong>Black Kite</strong><small>Sweden · Seed 04</small></div></div><strong className="score">13</strong></div>
            <div className="score-divider"><span>ANCIENT</span><b>:</b><span>ROUND {round}</span></div>
            <div className="team-row"><div className="team-name"><span className="team-glyph north">NS</span><div><strong>Northstar</strong><small>Denmark · Seed 01</small></div></div><strong className="score" aria-live="polite">{score}</strong></div>
            <div className="series"><span className="won">BK 13—8</span><span className="active">Ancient live</span><span>Mirage next</span></div>
          </article>
          <aside className="feed" aria-labelledby="feed-title">
            <div className="feed-title"><span id="feed-title">Match activity</span><button onClick={() => setConnected(false)} title="Simulate an offline state">Test offline</button></div>
            <ol>{activity.map(([label, text, time], index) => <li key={label}><i className={index === 0 ? "pulse" : ""} /><div><b>{label}</b><span>{text}</span></div><time>{time}</time></li>)}</ol>
            <button className="feed-action" onClick={() => setJoined(true)}>Follow this tournament <ArrowRight size={16} /></button>
          </aside>
        </div>
      </section>

      <section className="tournament-section" id="tournaments" aria-labelledby="bracket-title">
        <div className="section-heading compact"><div><span className="section-index">02 / BRACKET</span><h2 id="bracket-title">The road to the final</h2></div><a href="#live">View full bracket <ArrowRight size={16} /></a></div>
        <div className="bracket"><div className="round-column"><h3>SEMIFINALS <span>2 MATCHES</span></h3>{rounds.map((match, matchIndex) => <article className="match" key={matchIndex}><div className="match-caption"><span>{match.label}</span><time>{match.time}</time></div>{match.teams.map((team) => <div className={team.winner ? "team winner" : "team"} key={team.name}><span>{team.seed}</span><b>{team.name}</b><strong>{team.score}</strong></div>)}</article>)}</div><div className="bracket-connector" aria-hidden="true"><span /></div><div className="round-column final-column"><h3>GRAND FINAL <span>FRI · 21:00</span></h3><article className="match feature-match"><div className="match-caption"><span>Championship match</span><span>BO5</span></div><div className="team"><span>04</span><b>Black Kite</b><strong>—</strong></div><div className="team"><span>03</span><b>Morrow</b><strong>—</strong></div></article><p><Trophy size={18} /> Winner takes the Northern Circuit title</p></div></div>
      </section>

      <section className="architecture" id="architecture"><div><span className="section-index">03 / UNDER THE HOOD</span><h2>Built to stay correct<br />when the network isn’t.</h2></div><div className="architecture-list"><article><Radio /><div><b>Versioned live events</b><p>Ordered event envelopes, duplicate protection, and gap detection keep every client consistent.</p></div></article><article><ShieldCheck /><div><b>Server-enforced roles</b><p>Viewer, operator, and admin permissions are checked at the API boundary.</p></div></article><article><Brackets /><div><b>Predictable state</b><p>Domain, server, URL, and transient UI state stay separate—and testable.</p></div></article></div></section>
      <section className="closing"><div><span>NORTHERN CIRCUIT · LIVE NOW</span><h2>Don’t watch the bracket.<br /><em>Feel it move.</em></h2></div><button className="primary-cta inverse" onClick={jumpToLive}>Open live tournament <ArrowRight size={18} /></button></section>
      <footer><a className="brand" href="#top"><span className="brand-mark"><span /></span> ARENA</a><p>Demo product · No real money, identities, or personal data.</p><a href="https://github.com/fsaidad/arena" aria-label="GitHub repository"><Code2 size={18} /> GitHub</a></footer>

      {joined && <div className="modal-backdrop" role="presentation" onMouseDown={() => setJoined(false)}><section className="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setJoined(false)} aria-label="Close demo dialog"><X /></button><span className="team-glyph north"><Users /></span><span className="section-index">DEMO ACCESS</span><h2 id="demo-title">You’re in the arena.</h2><p>Join as spectator to follow the live match, or open the organizer workspace with safe demo data.</p><button className="primary-cta" onClick={() => { setJoined(false); jumpToLive(); }}>Join as spectator <ArrowRight size={18} /></button><a className="organizer-link" href="/organizer">Open organizer workspace</a></section></div>}
    </main>
  );
}
