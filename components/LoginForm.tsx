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
              isSelected ? "border-blue-500 bg-blue-600/10" : "border-white/10 bg-white/[.02]"
            }`}
          >
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
              style={{ backgroundColor: dealer.accent + "33", color: dealer.accent }}
            >
              {dealer.initials}
            </div>
            <h3 className="font-medium text-neutral-100">{dealer.name}</h3>
            <p className="text-xs text-neutral-500">{dealer.location}</p>
            <p className="mt-2 text-xs text-neutral-500">
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
                  className="w-full rounded-lg border border-white/10 bg-white/[.04] px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Password"
                />
                {hadError && (
                  <p className="text-xs text-red-400">Incorrect password — try again.</p>
                )}
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Sign in as {dealer.name}
                </button>
                <p className="text-center text-[10px] text-neutral-600">
                  Prototype demo — password is prefilled
                </p>
              </form>
            ) : (
              <button
                onClick={() => setSelected(dealer.id)}
                className="mt-4 w-full rounded-lg border border-white/15 py-1.5 text-sm font-medium text-neutral-300 hover:border-white/30 hover:text-white"
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
