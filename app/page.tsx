import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const comparisons = [
  ["The starting point", "Your goal", "A website or search", "A website or search", "A website or search", "A question to an AI"],
  ["Work that continues", "Persistent goals and agents", "Mostly page by page", "Mostly page by page", "Mostly page by page", "Conversation-led"],
  ["Where agents work", "Isolated, permission-checked runtime", "Extensions and browser features", "Extensions and browser features", "Extensions and browser features", "AI browsing session"],
  ["Human oversight", "Approvals, activity, and Guard review", "Browser controls", "Browser controls", "Browser controls", "Product-specific controls"],
];

export default function LandingPage() {
  return (
    <main className="kepler-site">
      <header className="ks-header">
        <Link href="/" className="ks-brand"><span className="ks-mark"><i /><i /><b /></span>KeplerV</Link>
        <nav aria-label="Main navigation"><a href="#experience">Experience</a><a href="#difference">Why KeplerV</a><a href="#guard">Trust</a></nav>
        <div className="ks-actions"><ThemeToggle /><a className="ks-github" href="https://github.com/ldbtech/KeplerV-Browser" target="_blank" rel="noreferrer">GitHub <span>↗</span></a></div>
      </header>

      <section className="ks-hero">
        <div className="ks-hero-copy">
          <div className="ks-kicker"><span /> INTRODUCING KEPLERV</div>
          <h1>A browser for<br />what you <em>want to do.</em></h1>
          <p>Most browsers take you from page to page. KeplerV starts with your intention—and brings goals, research, and the work of AI agents into one space you can understand and direct.</p>
          <div className="ks-hero-links"><a className="ks-button" href="https://github.com/ldbtech/KeplerV-Browser" target="_blank" rel="noreferrer">Explore the project <span>↗</span></a><a href="#experience" className="ks-text-link">See KeplerV in action <span>↓</span></a></div>
          <div className="ks-proof"><span>BUILT FOR macOS</span><i /> <span>TAURI · SVELTE · PYTHON</span><i /> <span>OPEN SOURCE</span></div>
        </div>
        <div className="ks-visual" aria-label="KeplerV Intent Space interface concept" role="img">
          <div className="ks-window">
            <div className="ks-window-bar"><div className="ks-lights"><i /><i /><i /></div><span>KEPLERV&nbsp; / &nbsp;INTENT SPACE</span><span className="ks-presence"><i /> PRESENT</span></div>
            <div className="ks-space"><div className="ks-space-label">YOUR INTENT SPACE <small>WEDNESDAY · 10:42 AM</small></div>
              <svg viewBox="0 0 700 390" preserveAspectRatio="none" aria-hidden="true"><path d="M214 190 C280 174 300 122 360 110"/><path d="M215 204 C290 215 310 274 365 286"/><path d="M215 200 C340 193 415 195 490 200"/><path d="M490 200 C545 181 560 145 602 142"/></svg>
              <div className="ks-goal"><span className="ks-goal-orbit"><i /></span><b>Plan a research trip</b><small>GOAL · IN PROGRESS</small></div>
              <div className="ks-agent"><span>A</span><b>Research agent</b><small>3 SOURCES FOUND</small></div>
              <div className="ks-resource"><span>↗</span><b>Field notes</b><small>WEB RESOURCE</small></div>
              <div className="ks-guard"><span>✓</span><b>Scope checked</b><small>GUARD · ALLOWED</small></div>
              <div className="ks-detail"><small>GOAL ACTIVITY</small><b>Compare field sites</b><p>Research is underway. Sources and decisions stay attached to the goal.</p><div><i /> AGENT WORKING <span>VIEW ACTIVITY ↗</span></div></div>
              <div className="ks-voice"><span>◖</span> PRESS TO SPEAK <small>VOICE READY</small></div>
            </div>
            <div className="ks-window-foot"><span>GOALS <b>01</b></span><span>AGENTS <b>01</b></span><span>ACTIVITY <b>LIVE</b></span><span className="ks-foot-status"><i /> LOCAL WORKSPACE</span></div>
          </div>
          <div className="ks-float-note"><span>01</span> Your goal stays at the center.</div>
        </div>
      </section>

      <div className="ks-ribbon"><span>INTENT, FIRST</span><i /><span>AGENTS WITH BOUNDARIES</span><i /><span>HUMAN CONTROL, BUILT IN</span><i /><span>ONE CONTINUOUS SPACE</span></div>

      <section className="ks-intro" id="experience"><div className="ks-kicker">A DIFFERENT WAY TO USE THE WEB</div><h2>Less tab juggling.<br /><em>More forward motion.</em></h2><p>KeplerV is being built around the reason you went online. Give a goal, explore the work as it unfolds, and step in whenever a decision needs you.</p></section>

      <section className="ks-cards">
        <article className="ks-card ks-card-dark"><div className="ks-card-number">01 / INTENT SPACE</div><div className="ks-constellation"><span className="ks-star-center">◎</span><i className="ks-line l1"/><i className="ks-line l2"/><i className="ks-dot d1"/><i className="ks-dot d2"/><i className="ks-dot d3"/><b>GOAL</b><small>AGENT</small></div><h3>Keep the work<br />in one place.</h3><p>Goals, agents, evidence, and resources live together in a spatial workspace—not a trail of disconnected pages.</p></article>
        <article className="ks-card ks-card-sand"><div className="ks-card-number">02 / UNIVERSAL AGENT RUNTIME</div><div className="ks-activity"><div><i className="ok"/> Goal created <small>10:39</small></div><div><i className="ok"/> Public sources searched <small>10:40</small></div><div><i className="ok"/> Evidence saved with citations <small>10:41</small></div><div><i className="wait"/> Approval required <small>YOU</small></div></div><h3>Agents that show<br />their work.</h3><p>Delegate public research to scoped agents. Follow their activity and inspect findings linked to their sources.</p></article>
        <article className="ks-card ks-card-mint" id="guard"><div className="ks-card-number">03 / KEPLERV GUARD</div><div className="ks-guard-visual"><div className="ks-shield">✓</div><span>REQUEST CHECKED</span><b>OUTSIDE ASSIGNED SCOPE</b><small>DENIED · REVIEW AVAILABLE</small></div><h3>Autonomy with<br />a visible boundary.</h3><p>AIP checks what an agent can do. Guard turns policy events into evidence-based investigations you can review.</p></article>
      </section>

      <section className="ks-voice-section"><div className="ks-voice-art"><div className="ks-orbit-ring r1"/><div className="ks-orbit-ring r2"/><div className="ks-orbit-core">K</div><div className="ks-wave"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><span>LISTENING · PROCESSING · SPEAKING</span></div><div><div className="ks-kicker">VOICE-NATIVE, NOT VOICE-ONLY</div><h2>Say what you mean.<br /><em>Stay in control.</em></h2><p>Speak a goal and KeplerV can interpret it against your workspace. Real microphone capture, transcription, and spoken responses are in the app; approvals remain deliberate human decisions.</p><a className="ks-text-link" href="https://github.com/ldbtech/KeplerV-Browser" target="_blank" rel="noreferrer">See how it’s built <span>↗</span></a></div></section>

      <section className="ks-phase"><div className="ks-phase-head"><div><div className="ks-kicker">CONNECTED UNIVERSE · PHASE 5</div><h2>Your internet,<br /><em>in context.</em></h2></div><p>KeplerV brings personal services into the same goal-centered environment—so you can watch, listen, read, and work while agents handle only the tasks you explicitly authorize.</p></div><div className="ks-phase-grid"><div className="ks-phase-item"><span className="ks-service-icon">▶</span><div><b>Media that belongs to the moment</b><p>Open supported video in a focused surface, keep your workspace underneath, and return to the goal when you’re done. Local video and YouTube experiences are available in the app.</p></div><small>MEDIA</small></div><div className="ks-phase-item"><span className="ks-service-icon">✉</span><div><b>Your accounts. Your permission.</b><p>Connect services through account-aware flows. Read-only email connectors support Gmail and Outlook architecture; private credentials are held in native secure storage.</p></div><small>CONNECTED SERVICES</small></div><div className="ks-phase-item"><span className="ks-service-icon">⌘</span><div><b>Separate permissions for people and agents</b><p>Provider scopes set the outer limit. KeplerV’s permission layer narrows what an agent can do, records activity, and puts sensitive actions behind human approval.</p></div><small>HUMAN + AGENT</small></div><div className="ks-phase-item"><span className="ks-service-icon">◉</span><div><b>One continuous workspace</b><p>Media, email, documents, websites, and approvals appear when relevant, then recede. Your goals and agent activity remain in view underneath.</p></div><small>EXPERIENCE SURFACES</small></div><div className="ks-phase-item"><span className="ks-service-icon">⛨</span><div><b>Account-aware Guard</b><p>Guard can investigate denied requests and service-capability boundaries with cited evidence, while minimizing exposure of personal content.</p></div><small>GUARD + AIP</small></div><div className="ks-phase-item"><span className="ks-service-icon">↗</span><div><b>Built to connect responsibly</b><p>OAuth with PKCE, scoped access, separate human and agent sessions, revocation, expiry handling, and explicit provider capability checks shape the architecture.</p></div><small>SECURITY MODEL</small></div></div><p className="ks-honesty">KeplerV is actively evolving. Provider support depends on official APIs and platform compatibility; Netflix and other DRM streaming playback are not claimed as verified.</p></section>

      <section className="ks-compare" id="difference"><div className="ks-kicker">A NEW CATEGORY, WITH A DIFFERENT CENTER</div><h2>Not another browser<br />with an AI button.</h2><p>KeplerV explores a different starting point: persistent intent, visible agent work, and human oversight in the same environment.</p><div className="ks-table-wrap"><table><thead><tr><th>WHAT’S DIFFERENT</th><th>KEPLERV</th><th>CHROME</th><th>FIREFOX</th><th>SAFARI</th><th>PERPLEXITY COMET</th></tr></thead><tbody>{comparisons.map((row) => <tr key={row[0]}>{row.map((cell, i) => i === 0 ? <th key={cell}>{cell}</th> : <td key={cell} className={i === 1 ? "ks-highlight" : ""}>{cell}</td>)}</tr>)}</tbody></table></div><small className="ks-compare-note">High-level product positioning, not a feature-by-feature benchmark. Other browsers continue to evolve.</small></section>

      <section className="ks-final"><div className="ks-kicker">THE INTERNET, WITH INTENTION</div><h2>Make room for<br /><em>what’s next.</em></h2><p>KeplerV is an early, open-source browser project building toward a more capable and more accountable way to work with the web.</p><div><a className="ks-button ks-button-light" href="https://github.com/ldbtech/KeplerV-Browser" target="_blank" rel="noreferrer">Follow development on GitHub <span>↗</span></a><a className="ks-text-link" href="mailto:ali.moh.ldb@gmail.com?subject=KeplerV">Contact the team <span>↗</span></a></div></section>
      <footer className="ks-footer"><Link href="/" className="ks-brand"><span className="ks-mark"><i/><i/><b/></span>KeplerV</Link><span>AN OPEN-SOURCE BROWSER EXPERIMENT</span><a href="mailto:ali.moh.ldb@gmail.com">ali.moh.ldb@gmail.com</a><a href="https://github.com/ldbtech/KeplerV-Browser" target="_blank" rel="noreferrer">GITHUB ↗</a><span>© {new Date().getFullYear()} KEPLERV</span></footer>
    </main>
  );
}
