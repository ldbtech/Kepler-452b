import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import IntentPreview from "@/components/IntentPreview";

const principles = [
  {
    number: "01",
    title: "Start with what matters",
    text: "Give KeplerV an intention. It becomes a persistent goal with clear progress, dependencies, and a record of what changed.",
  },
  {
    number: "02",
    title: "Delegate the work",
    text: "Purpose-built agents research, coordinate, and act across web resources. Their scope follows the goal you gave them.",
  },
  {
    number: "03",
    title: "Stay present, step in when needed",
    text: "See what is happening at a glance. Sensitive actions pause for your approval; unusual behavior opens an investigation you can inspect.",
  },
];

export default function LandingPage() {
  return (
    <main className="intent-site min-h-screen bg-base text-ink">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="KeplerV home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>keplerv</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#idea">The idea</a>
          <a href="#principles">How it works</a>
          <a href="#guard">Trust &amp; control</a>
        </nav>
        <div className="site-actions">
          <ThemeToggle />
          <a className="header-cta" href="mailto:hello@keplerv.com?subject=KeplerV%20browser">Follow the project <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className="hero" id="idea">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> AN EXPERIMENT IN WHAT BROWSING BECOMES</div>
          <h1>The internet,<br /><em>without the</em><br />endless tabs.</h1>
          <p className="hero-lede">KeplerV is an intent-native browser concept. You set a direction; agents work across the web while your goals, their activity, and your control stay in one continuous space.</p>
          <div className="hero-actions">
            <a className="primary-cta" href="#workspace">Explore the concept <span aria-hidden="true">↓</span></a>
            <span className="hero-note">A new interface for a more agentic web</span>
          </div>
          <div className="hero-meta"><span>01 — INTENTION</span><span>02 — AUTONOMY</span><span>03 — HUMAN CONTROL</span></div>
        </div>
        <div className="hero-art" aria-label="Abstract orbital illustration representing KeplerV" role="img">
          <div className="art-grid" />
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
          <div className="art-sun"><span /></div>
          <div className="planet planet-a" /><div className="planet planet-b" /><div className="planet planet-c" />
          <div className="art-caption"><span>KEPLERV / INTENT SPACE</span><span>ONE CONTINUOUS ENVIRONMENT</span></div>
          <div className="art-coordinates">38° 54′ 17″ N<br />01° 24′ 09″ E</div>
        </div>
      </section>

      <div className="signal-band"><span>GOALS IN MOTION</span><i /><span>AGENTS WITH BOUNDARIES</span><i /><span>HUMANS IN CONTROL</span><i /><span>WEB AS RESOURCE</span></div>

      <section className="preview-section" id="workspace">
        <div className="section-heading">
          <div><div className="eyebrow">A WINDOW INTO THE IDEA</div><h2>One space.<br /><em>Many intentions.</em></h2></div>
          <p>Resources and agents orbit the work that matters. Select an object to see how context can appear without taking you somewhere else.</p>
        </div>
        <IntentPreview />
        <p className="preview-caption"><span>CONCEPT PREVIEW</span> An illustrative, deterministic interaction. It is not a running browser or live AI system.</p>
      </section>

      <section className="principles-section" id="principles">
        <div className="principles-intro"><div className="eyebrow">A DIFFERENT KIND OF BROWSER</div><h2>Less navigating.<br /><em>More getting there.</em></h2><p>Today the browser is organized around destinations. KeplerV explores an interface organized around the reason you went online in the first place.</p></div>
        <div className="principles-list">{principles.map((item) => <article className="principle" key={item.number}><span className="principle-number">{item.number}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><span className="principle-arrow" aria-hidden="true">↗</span></article>)}</div>
      </section>

      <section className="guard-section" id="guard">
        <div className="guard-symbol" aria-hidden="true"><span>G</span><i /><i /><i /></div>
        <div className="guard-copy"><div className="eyebrow">AUTONOMY NEEDS A VISIBLE BOUNDARY</div><h2>Trust is part<br />of the interface.</h2><p>KeplerV Guard and the Agent Integrity Protocol are ideas for making delegated work legible: an action ledger, explicit permission scopes, and human approval when the stakes rise.</p><div className="guard-chips"><span>EXPERIMENTAL POLICY ENGINE</span><span>LOCAL SIMULATION</span><span>HUMAN APPROVAL</span></div></div>
        <div className="guard-example"><div className="guard-example-top"><span className="status-pulse" /> MOCK INVESTIGATION <span>KV—0042</span></div><h3>Unexpected access request</h3><p>A research agent followed an instruction embedded in a public document and requested access to a private resource.</p><div className="event-line"><b>01</b><span>Request evaluated</span><strong>DENIED</strong></div><div className="event-line"><b>02</b><span>Agent paused</span><strong>ACTIVE</strong></div><div className="event-line"><b>03</b><span>Your decision</span><strong className="pending">NEEDED</strong></div><a className="inspect-button" href="#workspace">See the contextual preview <span>↗</span></a></div>
      </section>

      <section className="closing-section"><div className="eyebrow">A LONG VIEW OF THE WEB</div><h2>The browser becomes<br /><em>your field of intent.</em></h2><p>KeplerV is an early exploration of that possibility: persistent goals, delegated work, contextual resources, and a human who can always understand what is happening.</p><a href="mailto:hello@keplerv.com?subject=KeplerV%20browser">Talk with us about the idea <span>↗</span></a></section>

      <footer className="site-footer"><Link href="/" className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>keplerv</span></Link><span>EXPLORING THE INTENT-NATIVE WEB</span><span>© {new Date().getFullYear()} KEPLERV</span></footer>
    </main>
  );
}
