"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dealer } from "@/lib/dealers";
import { logoutAction } from "@/app/login/actions";
import LiveChat from "@/components/LiveChat";

const NAV_ITEMS = [
  { label: "Live Auctions", href: "/", icon: "📡" },
  { label: "Watchlist", href: "/watchlist", icon: "♡" },
  { label: "Purchased", href: "/purchased", icon: "🧾" },
  { label: "AI Assistant", href: "/assistant", icon: "✦" },
  { label: "Guardrails", href: "/guardrails", icon: "🛡" },
  { label: "Analytics", href: "/analytics", icon: "📊" },
];

const MOBILE_TAB_ITEMS = [
  { label: "Live", href: "/", icon: "📡" },
  { label: "Watchlist", href: "/watchlist", icon: "♡" },
  { label: "Won", href: "/purchased", icon: "🧾" },
  { label: "Assistant", href: "/assistant", icon: "✦" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold shadow-lg shadow-blue-600/30">
          k
        </div>
        <span className="font-semibold tracking-tight">
          keplerv<span className="text-blue-400"> AI</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
          >
            <span className="w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="rounded-lg border border-white/10 bg-white/[.03] p-3 text-xs">
        <div className="mb-1 flex items-center gap-1.5 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          AI Agents Active
        </div>
        <p className="text-neutral-500">Monitoring 2,847 vehicles for you</p>
      </div>
    </>
  );
}

export default function AppShell({
  dealer,
  children,
}: {
  dealer: Dealer;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)] text-neutral-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/10 bg-neutral-950/60 px-3 py-4 backdrop-blur lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-white/10 bg-neutral-950 px-3 py-4">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-neutral-950/70 px-4 py-3 backdrop-blur-md sm:gap-4 sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-neutral-400 hover:text-neutral-100 lg:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="hidden flex-1 sm:block">
            <input
              placeholder="Search vehicles, make, model, or auction ID..."
              className="w-full max-w-md rounded-lg border border-white/10 bg-white/[.04] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled
            />
          </div>
          <div className="flex-1 sm:hidden" />

          <button className="relative text-neutral-400 hover:text-neutral-100">
            🔔
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          <div className="relative">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-1 text-sm sm:pr-3"
            >
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: dealer.accent + "33", color: dealer.accent }}
              >
                {dealer.initials}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-xs font-medium text-neutral-200">{dealer.name}</div>
                <div className="text-[10px] text-neutral-500">Dealer Account</div>
              </div>
            </button>
            {accountOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setAccountOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-white/10 bg-neutral-900 p-1 shadow-xl">
                  <div className="px-2 py-1.5 text-xs text-neutral-500">
                    {dealer.name} · {dealer.location}
                  </div>
                  <form action={logoutAction}>
                    <button className="w-full rounded-md px-2 py-1.5 text-left text-sm text-neutral-300 hover:bg-white/5">
                      Switch dealership
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/10 bg-neutral-950/95 backdrop-blur lg:hidden">
        {MOBILE_TAB_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-neutral-400 hover:text-neutral-100"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <LiveChat dealer={dealer} />
    </div>
  );
}
