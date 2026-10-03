"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dealer } from "@/lib/dealers";
import { logoutAction } from "@/app/login/actions";
import LiveChat from "@/components/LiveChat";
import {
  IconBell,
  IconBroadcast,
  IconChart,
  IconHeart,
  IconMenu,
  IconReceipt,
  IconShield,
  IconSparkle,
} from "@/components/icons";

const NAV_ITEMS = [
  { label: "Live Auctions", href: "/", icon: IconBroadcast },
  { label: "Watchlist", href: "/watchlist", icon: IconHeart },
  { label: "Purchased", href: "/purchased", icon: IconReceipt },
  { label: "AI Assistant", href: "/assistant", icon: IconSparkle },
  { label: "Guardrails", href: "/guardrails", icon: IconShield },
  { label: "Analytics", href: "/analytics", icon: IconChart },
];

const MOBILE_TAB_ITEMS = [
  { label: "Live", href: "/", icon: IconBroadcast },
  { label: "Watchlist", href: "/watchlist", icon: IconHeart },
  { label: "Won", href: "/purchased", icon: IconReceipt },
  { label: "Assistant", href: "/assistant", icon: IconSparkle },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-neutral-900">
          k
        </div>
        <span className="font-medium tracking-tight text-neutral-100">keplerv</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-white/[.06] text-neutral-100"
                  : "text-neutral-500 hover:bg-white/[.04] hover:text-neutral-200"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-lg border border-white/[.06] p-3 text-xs">
        <div className="mb-1 flex items-center gap-1.5 text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          AI agents active
        </div>
        <p className="text-neutral-600">Monitoring 2,847 vehicles</p>
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
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/[.06] px-3 py-4 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-white/[.06] bg-neutral-950 px-3 py-4">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/[.06] bg-neutral-950/80 px-4 py-3 backdrop-blur-md sm:gap-4 sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-neutral-500 hover:text-neutral-200 lg:hidden"
            aria-label="Open menu"
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <button className="relative text-neutral-500 hover:text-neutral-200">
            <IconBell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          <div className="relative">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-white/[.06] py-1 pl-1 pr-1 text-sm sm:pr-3"
            >
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                style={{ backgroundColor: dealer.accent + "26", color: dealer.accent }}
              >
                {dealer.initials}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-xs font-medium text-neutral-200">{dealer.name}</div>
                <div className="text-[10px] text-neutral-600">Dealer Account</div>
              </div>
            </button>
            {accountOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-white/[.08] bg-neutral-900 p-1 shadow-xl">
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
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/[.06] bg-neutral-950/95 backdrop-blur lg:hidden">
        {MOBILE_TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-neutral-500 hover:text-neutral-200"
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <LiveChat dealer={dealer} />
    </div>
  );
}
