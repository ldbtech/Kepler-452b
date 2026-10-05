"use client";

import { useState } from "react";
import { loginAction } from "@/app/login/actions";
import type { Dealer } from "@/lib/dealers";

export default function LoginForm({
  dealers,
  next,
  initialError,
  initialDealerId,
}: {
  dealers: Dealer[];
  next: string;
  initialError: boolean;
  initialDealerId: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(initialDealerId);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {dealers.map((dealer) => {
        const isSelected = selected === dealer.id;
        const hadError = initialError && initialDealerId === dealer.id;
        return (
          <div
            key={dealer.id}
            className={`rounded-2xl border p-4 transition-colors ${
              isSelected ? "border-accent bg-accent/10" : "border-line bg-surface"
            }`}
          >
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
              style={{ backgroundColor: dealer.accent + "33", color: dealer.accent }}
            >
              {dealer.initials}
            </div>
            <h3 className="font-medium text-ink">{dealer.name}</h3>
            <p className="text-xs text-ink-3">{dealer.location}</p>
            <p className="mt-2 text-xs text-ink-3">
              Focus: {dealer.focusCategories.join(", ").toLowerCase()}
            </p>

            {isSelected ? (
              <form action={loginAction} className="mt-4 flex flex-col gap-2">
                <input type="hidden" name="dealerId" value={dealer.id} />
                <input type="hidden" name="next" value={next} />
                <input
                  type="password"
                  name="password"
                  defaultValue={dealer.password}
                  className="w-full rounded-lg border border-line bg-fill px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Password"
                />
                {hadError && (
                  <p className="text-xs text-red-400">Incorrect password — try again.</p>
                )}
                <button
                  type="submit"
                  className="rounded-lg bg-accent py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Sign in as {dealer.name}
                </button>
                <p className="text-center text-[10px] text-ink-3">
                  Prototype demo — password is prefilled
                </p>
              </form>
            ) : (
              <button
                onClick={() => setSelected(dealer.id)}
                className="mt-4 w-full rounded-lg border border-line py-1.5 text-sm font-medium text-ink-2 hover:border-line-strong hover:text-ink"
              >
                Continue as {dealer.name}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
