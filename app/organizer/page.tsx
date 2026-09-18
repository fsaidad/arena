"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CalendarDays, Check, ChevronRight, CircleGauge, Clock3, Command, MoreHorizontal, Plus, Radio, RotateCcw, ShieldCheck, Users } from "lucide-react";

import { type DemoRole, useMatchControl } from "@/features/organizer/use-match-control";

const seeded = [
  { id: 1, name: "Black Kite", region: "Sweden", status: "Checked in" },
  { id: 2, name: "Northstar", region: "Denmark", status: "Checked in" },
  { id: 3, name: "Morrow", region: "Finland", status: "Checked in" },
  { id: 4, name: "Redline", region: "United Kingdom", status: "Invited" },
];

const queue = [
  { id: "UF", stage: "Upper final", teams: "Black Kite · Northstar", state: "Live", time: "Now" },
  { id: "LR2", stage: "Lower round 2", teams: "Orbit · Fable", state: "Ready", time: "16:30" },
  { id: "LF", stage: "Lower final", teams: "TBD · TBD", state: "Blocked", time: "19:00" },
];

export default function OrganizerPage() {
  const [participants, setParticipants] = useState(seeded);
  const [name, setName] = useState("");
  const [role, setRole] = useState<DemoRole>("operator");
  const { score, setScore, version, mode, notice, setNotice, publishResult } = useMatchControl(role);

  const addParticipant = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setParticipants((current) => [...current, { id: Date.now(), name: trimmed, region: "Demo region", status: "Invited" }]);
    setName("");
    setNotice(`${trimmed} added · synced`);
  };

  return (
    <main className="control-shell">
      <aside className="control-sidebar">
        <Link className="brand" href="/" aria-label="Arena home"><span className="brand-symbol" aria-hidden="true"><i /><i /></span><span>ARENA</span></Link>
        <div className="workspace-switcher"><span>NC</span><div><small>Workspace</small><strong>Northern Circuit</strong></div><ChevronRight size={15} /></div>
        <nav aria-label="Organizer navigation">
          <p>Manage</p><a className="active" href="#overview"><CircleGauge /> Overview</a><a href="#matches"><Radio /> Matches <span>3</span></a><a href="#participants"><Users /> Participants <span>{participants.length}</span></a><a href="#schedule"><CalendarDays /> Schedule</a>
          <p>Monitor</p><a href="#activity"><Activity /> Audit log</a>
        </nav>
        <div className="sidebar-bottom"><div><i className={mode === "persisted" ? "online" : ""} /><span><b>{mode === "persisted" ? "Services online" : "Preview mode"}</b><small>Version {version}</small></span></div><Link href="/"><ArrowLeft /> Public tournament</Link></div>
      </aside>

      <section className="control-workspace" id="overview">
        <header className="control-header">
          <div><p className="breadcrumb">Northern Circuit <span>/</span> Invitational 2026</p><h1>Overview</h1></div>
          <div className="operator-tools"><button className="command-button"><Command size={14} /> Search <kbd>⌘ K</kbd></button><div className="role-control"><label htmlFor="role">Demo role</label><select id="role" value={role} onChange={(event) => setRole(event.target.value as DemoRole)}><option value="viewer">Viewer</option><option value="operator">Operator</option><option value="admin">Admin</option></select></div></div>
        </header>

        <div className={`save-state ${notice.includes("Could not") || notice.includes("conflict") ? "error" : ""}`} role="status"><Check size={14} /> {notice}</div>

        <section className="metric-strip" aria-label="Tournament summary">
          <div><span>Check-in</span><strong>{participants.filter((item) => item.status === "Checked in").length}<small> / {participants.length}</small></strong><p>Closes in 42 min</p></div>
          <div><span>Matches today</span><strong>18</strong><p>6 completed · 1 live</p></div>
          <div><span>Live audience</span><strong>184</strong><p>+12 in the last hour</p></div>
          <div><span>Delivery</span><strong className="healthy"><i /> Healthy</strong><p>All clients synchronized</p></div>
        </section>

        <div className="control-grid">
          <section className="match-control-panel" id="matches">
            <div className="control-section-heading"><div><span className="live-chip"><i /> Live</span><h2>Upper final</h2><p>Best of 3 · Map 2 — Ancient</p></div><button aria-label="More match actions"><MoreHorizontal /></button></div>
            <div className="control-score">
              <div><span className="control-monogram">BK</span><label htmlFor="homeScore">Black Kite</label><input id="homeScore" type="number" value={13} readOnly /></div>
              <span className="score-colon">:</span>
              <div><span className="control-monogram secondary">NS</span><label htmlFor="awayScore">Northstar</label><input id="awayScore" type="number" value={score} onChange={(event) => setScore(Number(event.target.value))} disabled={role === "viewer"} /></div>
            </div>
            <div className="publish-bar"><div><span>Publishing updates</span><strong>Score · live clients · audit trail</strong></div><button onClick={() => void publishResult(score)} disabled={role === "viewer" || mode === "connecting"}>Publish result <ChevronRight size={17} /></button></div>
            {role === "viewer" && <p className="permission-note"><ShieldCheck /> Viewer can inspect live state but cannot publish results.</p>}
          </section>

          <aside className="queue-panel" id="schedule">
            <div className="control-section-heading"><div><p className="eyebrow">Today</p><h2>Match queue</h2></div><span>3 remaining</span></div>
            <div className="queue-list">{queue.map((item) => <article key={item.id}><span className="queue-id">{item.id}</span><div><strong>{item.stage}</strong><p>{item.teams}</p></div><div><time>{item.time}</time><em className={item.state.toLowerCase()}>{item.state}</em></div></article>)}</div>
            <button className="text-action">Open full schedule <ChevronRight size={16} /></button>
          </aside>
        </div>

        <section className="participants-panel" id="participants">
          <div className="control-section-heading"><div><p className="eyebrow">Roster</p><h2>Participants</h2></div><div className="participant-actions"><button onClick={() => { setParticipants(seeded); setNotice("Demo data reset"); }}><RotateCcw size={15} /> Reset demo</button><button className="add-trigger" onClick={() => document.getElementById("participantName")?.focus()}><Plus size={16} /> Add participant</button></div></div>
          <div className="add-participant"><label htmlFor="participantName">New participant</label><input id="participantName" value={name} onChange={(event) => setName(event.target.value)} placeholder="Team or player name" disabled={role === "viewer"} onKeyDown={(event) => { if (event.key === "Enter") addParticipant(); }} /><button onClick={addParticipant} disabled={role === "viewer"}>Add</button></div>
          <div className="participant-table" role="table" aria-label="Tournament participants">
            <div className="table-row table-head" role="row"><span role="columnheader">Seed</span><span role="columnheader">Participant</span><span role="columnheader">Region</span><span role="columnheader">Status</span><span role="columnheader" aria-label="Actions" /></div>
            {participants.map((item, index) => <div className="table-row" role="row" key={item.id}><span role="cell">{String(index + 1).padStart(2, "0")}</span><span role="cell"><i className="participant-avatar">{item.name.slice(0, 2).toUpperCase()}</i><b>{item.name}</b></span><span role="cell">{item.region}</span><span role="cell"><em className={item.status === "Checked in" ? "ok" : "pending"}>{item.status}</em></span><span role="cell"><button aria-label={`Actions for ${item.name}`}><MoreHorizontal size={17} /></button></span></div>)}
          </div>
        </section>

        <footer className="control-footer"><span><Clock3 size={14} /> Last synchronized just now</span><span>All times shown in EEST</span></footer>
      </section>
    </main>
  );
}
