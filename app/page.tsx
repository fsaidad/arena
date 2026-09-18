"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Clock3, Moon, Radio, Sun, Trophy, Wifi, WifiOff, X } from "lucide-react";

import { useLiveTournament } from "@/features/live-tournament/use-live-tournament";

const matches = [
  { stage: "Upper semifinal", time: "Final", home: "Black Kite", away: "Northstar", score: "13 — 11", active: false },
  { stage: "Upper semifinal", time: "Final", home: "Morrow", away: "Redline", score: "13 — 09", active: false },
  { stage: "Lower round 2", time: "16:30", home: "Orbit", away: "Fable", score: "—", active: false },
  { stage: "Upper final", time: "Live", home: "Black Kite", away: "Northstar", score: "13 — 11", active: true },
];

const activity = [
  ["Round 21", "Black Kite secured B site", "Now"],
  ["Timeout", "Northstar called a tactical pause", "2 min"],
  ["Round 19", "Fable converted a 1v2 clutch", "4 min"],
];

export default function Home() {
  const [dark, setDark] = useState(false);
  const [joined, setJoined] = useState(false);
  const [round, setRound] = useState(21);
  const { state: liveState, disconnect, reconnect } = useLiveTournament();
  const connected = liveState.status === "live";
  const connectionLabel = liveState.status === "live" ? "Live · synced" : liveState.status === "reconnecting" ? "Reconnecting" : liveState.status === "stale" ? "Stale · retrying" : "Offline · snapshot";

  useEffect(() => {
    const timer = window.setInterval(() => { if (connected) setRound((value) => value + 1); }, 7000);
    return () => window.clearInterval(timer);
  }, [connected]);

  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);

  return (
    <main id="top" className="public-shell">
      <a className="skip-link" href="#live">Skip to live match</a>
      {!connected && <div className="connection-banner" role="status"><WifiOff size={15} /><span>{liveState.status === "reconnecting" ? "Reconnecting to the live stream…" : "Live connection lost. Showing the last confirmed state."}</span><button onClick={reconnect}>Reconnect</button></div>}

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Arena home"><span className="brand-symbol" aria-hidden="true"><i /><i /></span><span>ARENA</span></a>
        <nav aria-label="Primary navigation"><a className="active" href="#live">Live</a><a href="#schedule">Matches</a><a href="#bracket">Bracket</a></nav>
        <div className="header-actions"><button className="round-button" onClick={() => setDark(!dark)} aria-label={`Use ${dark ? "light" : "dark"} theme`}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><Link className="control-link" href="/organizer">Arena Control <ArrowUpRight size={15} /></Link></div>
      </header>

      <section className="event-intro" aria-labelledby="event-title">
        <div><p className="overline">Northern circuit · Event 04</p><h1 id="event-title">Northern Circuit Invitational</h1></div>
        <div className="event-facts" aria-label="Event details"><span><b>Sep 17–19</b> Helsinki, Finland</span><span><b>24 teams</b> Double elimination</span></div>
      </section>

      <nav className="event-tabs" aria-label="Tournament sections"><a className="active" href="#live">Overview</a><a href="#schedule">Matches</a><a href="#bracket">Bracket</a><button onClick={() => setJoined(true)}>Follow event</button></nav>

      <section className="live-stage" id="live" aria-labelledby="live-heading">
        <div className="live-stage-topline"><div className="live-label"><i /> Live now</div><div className={`sync-state ${connected ? "is-live" : "is-stale"}`}>{connected ? <Wifi size={14} /> : <WifiOff size={14} />}{connectionLabel}</div></div>
        <div className="match-context"><span>Upper final</span><h2 id="live-heading">Best of 3 <b>·</b> Map 2 — Ancient</h2><span>Round {round}</span></div>
        <article className="scoreboard" aria-label="Live match score">
          <div className="team-row home-team"><div className="team-identity"><span className="team-monogram kite">BK</span><div><strong>Black Kite</strong><small>Sweden · Seed 04</small></div></div><strong className="score">{liveState.data.homeScore}</strong></div>
          <div className="score-separator"><span>Series</span><b>1 — 0</b></div>
          <div className="team-row away-team"><strong className="score" aria-live="polite">{liveState.data.awayScore}</strong><div className="team-identity"><div><strong>Northstar</strong><small>Denmark · Seed 01</small></div><span className="team-monogram north">NS</span></div></div>
        </article>
        <div className="map-score"><span><b>Map 1</b> Dust II <strong>13—8</strong></span><span className="current"><b>Map 2</b> Ancient <strong>{liveState.data.homeScore}—{liveState.data.awayScore}</strong></span><span><b>Map 3</b> Mirage <strong>Next</strong></span></div>
      </section>

      <section className="live-support" aria-label="Live match information">
        <div className="match-feed"><div className="section-title"><div><p className="overline">Live desk</p><h2>Match activity</h2></div><button onClick={disconnect}>Test offline</button></div><ol>{activity.map(([label, text, time], index) => <li key={label}><span className={index === 0 ? "feed-dot active" : "feed-dot"} /><b>{label}</b><p>{text}</p><time>{time}</time></li>)}</ol></div>
        <aside className="up-next"><p className="overline">Up next</p><time><Clock3 size={15} /> 16:30 EEST</time><div><strong>Orbit</strong><span>vs</span><strong>Fable</strong></div><p>Lower bracket · Round 2</p><button onClick={() => setJoined(true)}>Set reminder <ChevronRight size={16} /></button></aside>
      </section>

      <section className="schedule-section" id="schedule" aria-labelledby="schedule-title">
        <div className="section-title wide"><div><p className="overline">Sep 17 · Day one</p><h2 id="schedule-title">Match schedule</h2></div><span>Times shown in EEST</span></div>
        <div className="match-list">{matches.map((match, index) => <article className={match.active ? "schedule-row active" : "schedule-row"} key={`${match.home}-${index}`}><time>{match.time}</time><span>{match.stage}</span><strong>{match.home}</strong><i>vs</i><strong>{match.away}</strong><b>{match.score}</b><ChevronRight size={18} /></article>)}</div>
      </section>

      <section className="bracket-section" id="bracket" aria-labelledby="bracket-title">
        <div className="section-title wide"><div><p className="overline">Playoffs · Upper bracket</p><h2 id="bracket-title">Path to the final</h2></div><a href="#schedule">All matches <ArrowUpRight size={16} /></a></div>
        <div className="bracket-board"><div className="bracket-round"><h3>Semifinals <span>Completed</span></h3><article><span><b>04</b> Black Kite <strong>13</strong></span><span><b>01</b> Northstar <strong>11</strong></span></article><article><span><b>03</b> Morrow <strong>13</strong></span><span><b>02</b> Redline <strong>09</strong></span></article></div><div className="bracket-line" aria-hidden="true" /><div className="bracket-round final"><h3>Grand final <span>Fri · 21:00</span></h3><article><span><b>04</b> Black Kite <strong>—</strong></span><span><b>03</b> Morrow <strong>—</strong></span></article><p><Trophy size={16} /> Northern Circuit title</p></div></div>
      </section>

      <footer className="site-footer"><a className="brand" href="#top"><span className="brand-symbol" aria-hidden="true"><i /><i /></span><span>ARENA</span></a><p>Independent tournament operations demo.<br />No real identities or personal data.</p><a href="https://github.com/fsaidad/arena">View source <ArrowUpRight size={15} /></a></footer>

      {joined && <div className="modal-backdrop" role="presentation" onMouseDown={() => setJoined(false)}><section className="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setJoined(false)} aria-label="Close demo dialog"><X size={19} /></button><div className="modal-icon"><Radio size={20} /></div><p className="overline">Event access</p><h2 id="demo-title">Follow Northern Circuit</h2><p>Keep this live match in view or step into the organizer workspace with safe demo data.</p><button className="modal-primary" onClick={() => setJoined(false)}>Continue as spectator</button><Link href="/organizer">Open Arena Control <ArrowUpRight size={15} /></Link></section></div>}
    </main>
  );
}
