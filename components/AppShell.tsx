import Link from "next/link";

const NAV_ITEMS = [
  { label: "Live Auctions", href: "/", icon: "📡" },
  { label: "Watchlist", href: "/watchlist", icon: "♡" },
  { label: "Purchased", href: "/purchased", icon: "🧾" },
  { label: "AI Assistant", href: "/assistant", icon: "✦" },
  { label: "Guardrails", href: "/guardrails", icon: "🛡" },
  { label: "Analytics", href: "/analytics", icon: "📊" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 px-3 py-4">
        <div className="flex items-center gap-2 px-2 pb-6">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm font-bold">
            k
          </div>
          <span className="font-semibold tracking-tight">keplerv</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 data-[active=true]:bg-blue-600/15 data-[active=true]:text-blue-400"
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-white/10 px-6 py-3">
          <div className="flex-1">
            <input
              placeholder="Search vehicles, make, model, or auction ID..."
              className="w-full max-w-md rounded-lg border border-white/10 bg-white/[.04] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled
            />
          </div>
          <button className="relative text-neutral-400 hover:text-neutral-100">
            🔔
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold">
              SM
            </div>
            <div className="leading-tight">
              <div className="text-xs font-medium text-neutral-200">Sunrise Motors</div>
              <div className="text-[10px] text-neutral-500">Dealer Account</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
