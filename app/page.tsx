import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { getVehicles } from "@/lib/vehicles";
import { formatUsd, getAiRecommendation } from "@/lib/demo";
import {
  IconBroadcast,
  IconChart,
  IconCube,
  IconGear,
  IconShield,
  IconSparkle,
  IconUsers,
} from "@/components/icons";

export default function LandingPage() {
  const vehicles = getVehicles().slice(0, 3);

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-base/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-base">
              k
            </div>
            <span className="font-medium tracking-tight">keplerv</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-6 pl-6 text-sm text-ink-2 sm:flex">
            <a href="#how-it-works" className="hover:text-ink">How it works</a>
            <a href="#vision" className="hover:text-ink">Our vision</a>
            <a href="#product" className="hover:text-ink">Live data</a>
            <a
              href="https://github.com/ldbtech/Kepler-452b"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              GitHub
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-base hover:opacity-90"
            >
              View live demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live prototype, built on real Copart auction data
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            The car marketplace,
            <br />
            run by AI agents.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2">
            keplerv gives dealers and fleet buyers autonomous AI agents that inspect, price,
            and bid on vehicles at live auction — within guardrails you set, explained in
            plain English, every time.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-base hover:opacity-90 sm:w-auto"
            >
              View live demo
            </Link>
            <a
              href="#vision"
              className="w-full rounded-full border border-line px-6 py-3 text-sm font-medium hover:border-line-strong sm:w-auto"
            >
              Read our vision
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-sm font-medium uppercase tracking-wide text-ink-3">
            The problem
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-xl font-medium text-ink sm:text-2xl">
            Wholesale and salvage auctions move in seconds. Humans can&apos;t watch hundreds
            of them at once — so money gets left on the table, every single day.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ProblemCard
              title="No time to inspect"
              body="Damage photos, repair scope, title status — reviewing it all for every lot you might want is a full-time job on its own."
            />
            <ProblemCard
              title="Bidding wars you can't attend"
              body="The best lots close in a 30-second window. If you're not watching that exact moment, you've already lost it."
            />
            <ProblemCard
              title="Guesswork on true value"
              body="Without market comps and a real repair-cost estimate, every bid is a gamble on margin you can't actually see."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-sm font-medium uppercase tracking-wide text-ink-3">
          How keplerv works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-xl font-medium sm:text-2xl">
          You set the rules. The AI does the watching, the math, and the bidding.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <StepCard
            icon={IconCube}
            step="01"
            title="AI inspects"
            body="Every photo is turned into a condition score, repair-cost range, and an interactive 3D view — no in-person inspection needed."
          />
          <StepCard
            icon={IconChart}
            step="02"
            title="AI prices"
            body="Market comps and wholesale value ranges are computed per lot, so you know the real margin before a single bid is placed."
          />
          <StepCard
            icon={IconShield}
            step="03"
            title="AI bids, within your guardrails"
            body="Max bid per vehicle, total budget cap, risk tolerance — you set the limits once, and auto-bid never crosses them."
          />
          <StepCard
            icon={IconSparkle}
            step="04"
            title="You stay in control"
            body="Every recommendation comes with plain-English reasoning. Ask the AI assistant why, any time, in plain language."
          />
        </div>
      </section>

      {/* Live product glimpse */}
      <section id="product" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-wide text-ink-3">
                Not a mockup
              </h2>
              <p className="mt-3 max-w-xl text-xl font-medium sm:text-2xl">
                These are real, currently-live lots pulled from Copart — same data the demo
                dashboard runs on.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-line-strong"
            >
              Open the dashboard →
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {vehicles.map((v) => {
              const cover =
                v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
              const rec = getAiRecommendation(v);
              return (
                <div
                  key={v.lotNumber}
                  className="overflow-hidden rounded-2xl border border-line bg-base"
                >
                  <div className="relative aspect-[4/3] bg-neutral-900">
                    {cover && (
                      <Image
                        src={cover.file}
                        alt={`${v.year} ${v.make} ${v.model}`}
                        fill
                        className="object-cover"
                        sizes="360px"
                      />
                    )}
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      <span className="h-1 w-1 rounded-full bg-white" /> LIVE
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-medium">
                      {v.year} {v.make} {v.model}
                    </h3>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {v.damage ?? "Unknown damage"} · {v.location ?? "—"}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-ink-3">AI est. value</span>
                      <span className="font-semibold">
                        {formatUsd(rec.estimatedMarketValue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section id="vision" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-sm font-medium uppercase tracking-wide text-ink-3">
          Where this goes
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-xl font-medium sm:text-2xl">
          Buying a vehicle at auction looks a lot like trading looked before algorithms —
          manual, slow, and limited by how many screens one person can watch. That changes.
        </p>

        <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-10">
          <VisionRow
            icon={IconUsers}
            title="From one buyer, one screen — to one buyer, every auction"
            body="Today, a buyer can realistically track a handful of live lots at once. An AI agent doesn't have that limit. The next version of keplerv watches every relevant auction across every lane, simultaneously, and only surfaces the moments that need a human decision."
          />
          <VisionRow
            icon={IconChart}
            title="Autonomous portfolio management, not one-off bids"
            body="Instead of bidding lot by lot, you'll hand the AI a budget and a mandate — 'build me 20 clean-title sedans under $8k this month' — and it allocates, re-allocates, and executes across dozens of simultaneous auctions to hit that target, the way a trading desk manages a portfolio instead of a single stock."
          />
          <VisionRow
            icon={IconCube}
            title="Inspection without ever seeing the car"
            body="Photos in, a trustworthy 3D model and damage assessment out — good enough that remote, blind bidding stops being a disadvantage. We're already running this today with on-device depth reconstruction and an experimental diffusion-model pipeline; it gets more accurate every generation."
          />
          <VisionRow
            icon={IconBroadcast}
            title="Markets that negotiate with themselves"
            body="When every serious bidder is represented by an agent with known constraints, price discovery stops being about who blinks first at 11:59 and starts being a real-time negotiation between algorithms — faster, fairer, and far less driven by who happened to be staring at the screen at the right second."
          />
          <VisionRow
            icon={IconGear}
            title="One conversation, not twelve dashboards"
            body="The end state isn't more screens — it's fewer. You tell your AI what you want in plain language, it tells you what it did and why, and the guardrails make sure it never surprises you. That's the interface we're building toward."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            This is a working prototype, not a deck.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-2">
            Sign in with any of the three demo dealer accounts and watch the AI inspect,
            price, and bid in real time.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-base hover:opacity-90"
          >
            View live demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-ink-3">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <span>© {new Date().getFullYear()} keplerv. Built for the AI for Good competition.</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/ldbtech/Kepler-452b"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              GitHub
            </a>
            <a href="mailto:hello@keplerv.com" className="hover:text-ink">
              hello@keplerv.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProblemCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-base p-6">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}

function StepCard({
  icon: Icon,
  step,
  title,
  body,
}: {
  icon: typeof IconCube;
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-ink-3">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
        <span className="text-xs font-medium">{step}</span>
      </div>
      <h3 className="mt-3 font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}

function VisionRow({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof IconCube;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{body}</p>
      </div>
    </div>
  );
}
