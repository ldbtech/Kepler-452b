"use client";

import { useState } from "react";

type ObjectKey = "goal" | "agent" | "resource" | "guard";

const details: Record<ObjectKey, { label: string; title: string; copy: string; state: string }> = {
  goal: { label: "PERSISTENT GOAL", title: "Plan a research trip", copy: "Compare field sites, build a travel plan, and surface the decisions that need your attention.", state: "3 OF 5 TASKS MOVING" },
  agent: { label: "DELEGATED AGENT", title: "Field-site researcher", copy: "Comparing public sources across three locations. Scope: read public pages and prepare evidence.", state: "WORKING · SCOPE LIMITED" },
  resource: { label: "WEB RESOURCE", title: "Coastal observatory", copy: "A public source attached to this goal. It appears in context and can be dismissed without leaving the intent space.", state: "PUBLIC RESOURCE" },
  guard: { label: "GUARD INVESTIGATION", title: "A request was stopped", copy: "The agent asked for a private resource beyond its assigned scope. The request was denied and its activity paused for review.", state: "HUMAN DECISION NEEDED" },
};

export default function IntentPreview() {
  const [selected, setSelected] = useState<ObjectKey>("goal");
  const active = details[selected];

  return (
    <div className="intent-preview">
      <div className="preview-topbar"><div className="preview-brand"><span className="mini-mark"><i /><i /><i /></span><span>KEPLERV</span></div><div className="preview-presence"><span className="presence-light" /> PRESENCE <b>COORDINATING</b></div><button className="preview-control" type="button" onClick={() => setSelected("guard")} aria-label="Show activity alert">● <span>1 needs review</span></button></div>
      <div className="preview-canvas">
        <div className="canvas-label">YOUR INTENT SPACE <span>NOW · LOCAL SIMULATION</span></div>
        <svg className="graph-lines" viewBox="0 0 800 420" preserveAspectRatio="none" aria-hidden="true">
          <path d="M185 198 C265 180 290 150 352 130" /><path d="M185 210 C270 230 308 272 370 290" /><path d="M185 208 C330 205 450 210 535 216" /><path d="M535 216 C590 202 622 166 664 158" />
        </svg>
        <button className={`graph-node central-node ${selected === "goal" ? "chosen" : ""}`} onClick={() => setSelected("goal")} type="button"><span className="node-orbit"/><span className="node-core"/><span className="node-name">Plan a research trip</span><span className="node-sub">GOAL · 60% MOVING</span></button>
        <button className={`graph-node agent-node ${selected === "agent" ? "chosen" : ""}`} onClick={() => setSelected("agent")} type="button"><span className="agent-mark">A</span><span className="node-name">Researcher</span><span className="node-sub">WORKING</span></button>
        <button className={`graph-node resource-node ${selected === "resource" ? "chosen" : ""}`} onClick={() => setSelected("resource")} type="button"><span className="resource-mark">↗</span><span className="node-name">Observatory</span><span className="node-sub">WEB RESOURCE</span></button>
        <button className={`graph-node guard-node ${selected === "guard" ? "chosen" : ""}`} onClick={() => setSelected("guard")} type="button"><span className="guard-mark">!</span><span className="node-name">Guard review</span><span className="node-sub">PAUSED · REVIEW</span></button>
        <div className="graph-legend"><span><i className="legend-goal"/> GOAL</span><span><i className="legend-agent"/> AGENT</span><span><i className="legend-resource"/> RESOURCE</span></div>
        <aside className="context-card" aria-live="polite"><div className="context-top"><span>{active.label}</span><button type="button" onClick={() => setSelected("goal")} aria-label="Dismiss contextual object">×</button></div><h3>{active.title}</h3><p>{active.copy}</p><div className={`context-state ${selected === "guard" ? "state-warning" : ""}`}><span />{active.state}</div></aside>
        <div className="audio-cue"><div className="audio-glyph"><i/><i/><i/><i/><i/></div><span>INTENT CAPTURE</span><b>SIMULATED</b></div>
      </div>
      <div className="preview-bottom"><span><i/> LOCAL SIMULATION · NO LIVE AGENTS</span><span>SELECT AN OBJECT TO INSPECT</span><span>GUARD POLICY <b>EXPERIMENTAL</b></span></div>
    </div>
  );
}
