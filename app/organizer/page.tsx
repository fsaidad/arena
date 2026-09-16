"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CalendarClock, Check, ChevronRight, CircleGauge, Plus, RotateCcw, ShieldCheck, Users } from "lucide-react";

const seeded = [
  { id: 1, name: "Black Kite", region: "Sweden", status: "Checked in" },
  { id: 2, name: "Northstar", region: "Denmark", status: "Checked in" },
  { id: 3, name: "Morrow", region: "Finland", status: "Checked in" },
  { id: 4, name: "Redline", region: "United Kingdom", status: "Invited" },
];

export default function OrganizerPage() {
  const [participants, setParticipants] = useState(seeded);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("All changes saved");
  const [role, setRole] = useState("Operator");
  const [score, setScore] = useState(11);

  useEffect(() => {
    const context = (document as unknown as { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "add_demo_participant",
      title: "Add demo participant",
      description: "Add one safe demo participant to the visible Arena organizer roster.",
      inputSchema: { type: "object", properties: { name: { type: "string", minLength: 1, maxLength: 60 } }, required: ["name"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const candidate = typeof input === "object" && input !== null && "name" in input ? String(input.name).trim() : "";
        if (!candidate || candidate.length > 60) throw new Error("Participant name must contain 1–60 characters.");
        setParticipants((current) => [...current, { id: Date.now(), name: candidate, region: "Demo region", status: "Invited" }]);
        setNotice(`${candidate} added · synced`);
        return { participant: candidate, status: "invited" };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const addParticipant = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setParticipants((current) => [...current, { id: Date.now(), name: trimmed, region: "Demo region", status: "Invited" }]);
    setName(""); setNotice(`${trimmed} added · synced`);
  };

  const updateResult = () => {
    const previous = score;
    setScore(12); setNotice("Saving result…");
    window.setTimeout(() => setNotice("Result saved · live clients updated"), 650);
    return () => setScore(previous);
  };

  return (
    <main className="organizer-shell">
      <aside className="organizer-nav">
        <Link className="brand" href="/"><span className="brand-mark"><span /></span>ARENA</Link>
        <div><span className="nav-label">WORKSPACE</span><strong>Northern Circuit</strong><small>Invitational 2026</small></div>
        <nav aria-label="Organizer navigation"><a className="active" href="#overview"><CircleGauge /> Overview</a><a href="#participants"><Users /> Participants <span>{participants.length}</span></a><a href="#schedule"><CalendarClock /> Schedule</a><a href="#activity"><Activity /> Activity</a></nav>
        <Link href="/" className="back-link"><ArrowLeft /> Back to public site</Link>
      </aside>
      <section className="workspace">
        <header className="workspace-header"><div><span className="section-index">ORGANIZER / OVERVIEW</span><h1>Match control</h1></div><div className="role-control"><label htmlFor="role">Demo role</label><select id="role" value={role} onChange={(event) => setRole(event.target.value)}><option>Viewer</option><option>Operator</option><option>Admin</option></select></div></header>
        <div className="save-state" role="status"><Check /> {notice}</div>
        <div className="ops-stats"><div><span>CHECK-IN</span><strong>{participants.filter((item) => item.status === "Checked in").length} / {participants.length}</strong><small>Closes in 42 min</small></div><div><span>MATCHES</span><strong>6 live</strong><small>18 scheduled today</small></div><div><span>STREAM</span><strong>184</strong><small>Connected spectators</small></div></div>

        <section className="control-panel" id="schedule">
          <div className="panel-heading"><div><span className="section-index">CURRENT MATCH</span><h2>Black Kite <b>vs</b> Northstar</h2></div><span className="sync-state is-live"><Activity size={15} /> Live · version 42</span></div>
          <div className="result-control"><div><label htmlFor="homeScore">Black Kite</label><input id="homeScore" type="number" value={13} readOnly /></div><span>:</span><div><label htmlFor="awayScore">Northstar</label><input id="awayScore" type="number" value={score} onChange={(event) => setScore(Number(event.target.value))} disabled={role === "Viewer"} /></div><button onClick={updateResult} disabled={role === "Viewer"}>Publish result <ChevronRight /></button></div>
          {role === "Viewer" && <p className="permission-note"><ShieldCheck /> Viewer can inspect live state but cannot publish results.</p>}
        </section>

        <section className="participants-panel" id="participants">
          <div className="panel-heading"><div><span className="section-index">ROSTER</span><h2>Participants</h2></div><button className="reset-button" onClick={() => { setParticipants(seeded); setNotice("Demo data reset"); }}><RotateCcw /> Reset demo</button></div>
          <div className="add-participant"><label htmlFor="participantName">Add participant</label><div><input id="participantName" value={name} onChange={(event) => setName(event.target.value)} placeholder="Team or player name" disabled={role === "Viewer"} /><button onClick={addParticipant} disabled={role === "Viewer"}><Plus /> Add</button></div></div>
          <div className="participant-table" role="table" aria-label="Tournament participants"><div className="table-row table-head" role="row"><span role="columnheader">Participant</span><span role="columnheader">Region</span><span role="columnheader">Status</span></div>{participants.map((item, index) => <div className="table-row" role="row" key={item.id}><span role="cell"><i>{String(index + 1).padStart(2,"0")}</i><b>{item.name}</b></span><span role="cell">{item.region}</span><span role="cell"><em className={item.status === "Checked in" ? "ok" : "pending"}>{item.status}</em></span></div>)}</div>
        </section>
      </section>
    </main>
  );
}
