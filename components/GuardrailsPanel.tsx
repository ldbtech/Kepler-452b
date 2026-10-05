"use client";

import { useEffect, useState } from "react";
import type { CustomRule, Dealer, RiskTolerance } from "@/lib/dealers";
import {
  AUTONOMY_LEVELS,
  getEffectiveDealer,
  parseFreeformRule,
  resetGuardrailOverrides,
  saveGuardrailOverrides,
  type GuardrailOverrides,
} from "@/lib/guardrails";
import { formatUsd } from "@/lib/demo";
import {
  IconAlertTriangle,
  IconCheck,
  IconPlus,
  IconShield,
  IconSparkle,
  IconTrash,
} from "@/components/icons";

const RISK_OPTIONS: RiskTolerance[] = ["Low", "Low – Moderate", "Moderate", "Moderate – High"];
const CATEGORY_OPTIONS = ["SEDAN", "AUTOMOBILE", "SUV", "PICKUP", "VAN", "MEDIUM DUTY/BOX TRUCKS"];

type Draft = {
  maxBidPerVehicle: number;
  totalBudgetCap: number;
  riskTolerance: RiskTolerance;
  interventionPreference: string;
  askAboveAmount: number;
  pausedAutonomy: boolean;
  customRules: CustomRule[];
};

function draftFrom(dealer: Dealer): Draft {
  return {
    maxBidPerVehicle: dealer.maxBidPerVehicle,
    totalBudgetCap: dealer.totalBudgetCap,
    riskTolerance: dealer.riskTolerance,
    interventionPreference: dealer.interventionPreference,
    askAboveAmount: dealer.askAboveAmount ?? Math.round(dealer.maxBidPerVehicle / 2 / 50) * 50,
    pausedAutonomy: dealer.pausedAutonomy ?? false,
    customRules: dealer.customRules ?? [],
  };
}

export default function GuardrailsPanel({ dealer }: { dealer: Dealer }) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(dealer));
  const [dirty, setDirty] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [ruleCategory, setRuleCategory] = useState(CATEGORY_OPTIONS[0]);
  const [ruleCap, setRuleCap] = useState("");
  const [freeform, setFreeform] = useState("");

  useEffect(() => {
    // Overrides only exist in localStorage, so the real draft is loaded
    // after mount — this matches what the rest of the app will actually use.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(draftFrom(getEffectiveDealer(dealer)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealer.id]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function addRule(rule: CustomRule) {
    update("customRules", [...draft.customRules, rule]);
  }

  function removeRule(id: string) {
    update(
      "customRules",
      draft.customRules.filter((r) => r.id !== id),
    );
  }

  function addCategoryRule(kind: "exclude-category" | "cap-category") {
    const capAmount = Number(ruleCap);
    if (kind === "cap-category" && !(capAmount > 0)) return;
    addRule({
      id: `rule-${Date.now()}`,
      kind,
      category: ruleCategory,
      capAmount: kind === "cap-category" ? capAmount : undefined,
      label:
        kind === "cap-category"
          ? `Cap ${ruleCategory.toLowerCase()} at ${formatUsd(capAmount)}`
          : `Never bid on ${ruleCategory.toLowerCase()}`,
    });
    setRuleCap("");
  }

  function addFreeformRule() {
    if (!freeform.trim()) return;
    addRule(parseFreeformRule(freeform));
    setFreeform("");
  }

  function save() {
    const overrides: GuardrailOverrides = { ...draft };
    saveGuardrailOverrides(dealer.id, overrides);
    setDirty(false);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 2000);
  }

  function reset() {
    resetGuardrailOverrides(dealer.id);
    setDraft(draftFrom(dealer));
    setDirty(false);
  }

  const autonomyIndex = Math.max(
    0,
    AUTONOMY_LEVELS.findIndex((l) => l.value === draft.interventionPreference),
  );

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Guardrails</h1>
          <p className="mt-0.5 text-sm text-ink-3">
            The policy your AI operates under — editable, enforced live across every auction.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedPulse && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <IconCheck className="h-3.5 w-3.5" strokeWidth={2} /> Saved
            </span>
          )}
          <button
            onClick={reset}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-line-strong hover:text-ink"
          >
            Reset to defaults
          </button>
          <button
            onClick={save}
            disabled={!dirty}
            className="rounded-lg bg-ink px-4 py-1.5 text-xs font-semibold text-base hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save changes
          </button>
        </div>
      </div>

      {/* Vision framing */}
      <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <IconSparkle className="h-4 w-4 text-accent" strokeWidth={1.5} />
          Where this is going
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Guardrails like these are an early, blunt version of something that gets much more
          precise over the next few decades: less a form you fill out once, more a constitution
          your AI is accountable to continuously — layered across a dealership&apos;s locations
          and staff, renegotiated by the AI only within bounds you&apos;ve explicitly delegated,
          with a full audit trail and a kill switch that always wins.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Autonomy level */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-12">
          <div className="mb-1 text-sm font-medium text-ink">Autonomy level</div>
          <p className="mb-4 text-xs text-ink-3">
            How much your AI is allowed to do without asking first — like autonomy levels for
            self-driving, but for bidding.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {AUTONOMY_LEVELS.map((level, i) => {
              const active = level.value === draft.interventionPreference;
              return (
                <button
                  key={level.value}
                  onClick={() => update("interventionPreference", level.value)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    active ? "border-accent bg-accent/10" : "border-line hover:border-line-strong"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                        active ? "bg-accent text-white" : "bg-fill text-ink-3"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-ink">{level.title}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">
                    {level.description}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-fill">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${((autonomyIndex + 1) / AUTONOMY_LEVELS.length) * 100}%` }}
            />
          </div>
          {draft.interventionPreference === "Ask above threshold" && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-ink-3">Auto-bid under</span>
              <input
                type="number"
                value={draft.askAboveAmount}
                onChange={(e) => update("askAboveAmount", Number(e.target.value) || 0)}
                className="w-28 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-line-strong focus:outline-none"
              />
              <span className="text-xs text-ink-3">— ask me above that</span>
            </div>
          )}
        </div>

        {/* Spending limits */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-ink-3">Max bid per vehicle</span>
            <span className="text-lg font-semibold text-ink">
              {formatUsd(draft.maxBidPerVehicle)}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={50000}
            step={500}
            value={draft.maxBidPerVehicle}
            onChange={(e) => update("maxBidPerVehicle", Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-3">
            <span>$1,000</span>
            <span>$50,000</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-ink-3">Total budget cap</span>
            <span className="text-lg font-semibold text-ink">
              {formatUsd(draft.totalBudgetCap)}
            </span>
          </div>
          <input
            type="range"
            min={10000}
            max={500000}
            step={5000}
            value={draft.totalBudgetCap}
            onChange={(e) => update("totalBudgetCap", Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-3">
            <span>$10,000</span>
            <span>$500,000</span>
          </div>
        </div>

        {/* Risk tolerance */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-6">
          <div className="mb-3 text-sm text-ink-3">Risk tolerance</div>
          <div className="flex flex-wrap gap-2">
            {RISK_OPTIONS.map((level) => (
              <button
                key={level}
                onClick={() => update("riskTolerance", level)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  draft.riskTolerance === level
                    ? "bg-accent text-white"
                    : "bg-fill text-ink-3 hover:text-ink-2"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-3">
            Higher tolerance lets the AI bid on vehicles with more reported damage or repair
            uncertainty, in exchange for a lower entry price.
          </p>
        </div>

        {/* Circuit breaker */}
        <div
          className={`rounded-2xl border p-4 xl:col-span-6 ${
            draft.pausedAutonomy ? "border-red-500/40 bg-red-500/[.06]" : "border-line bg-surface"
          }`}
        >
          <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink">
            <IconShield className={`h-4 w-4 ${draft.pausedAutonomy ? "text-red-400" : ""}`} strokeWidth={1.5} />
            Autonomy circuit breaker
          </div>
          <p className="mb-3 text-xs text-ink-3">
            Instantly stops every autonomous bid across your whole portfolio — your guardrails
            and rules stay exactly as set, the AI just stops acting on them. You can still bid
            manually.
          </p>
          <button
            onClick={() => update("pausedAutonomy", !draft.pausedAutonomy)}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              draft.pausedAutonomy
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-ink text-base hover:opacity-90"
            }`}
          >
            {draft.pausedAutonomy ? "Resume autonomous bidding" : "Pause all autonomous bidding"}
          </button>
        </div>

        {/* Custom rules */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-12">
          <div className="mb-1 text-sm font-medium text-ink">Custom rules</div>
          <p className="mb-3 text-xs text-ink-3">
            Specific instructions on top of your base guardrails — build one from a dropdown, or
            just tell the AI in plain English.
          </p>

          {draft.customRules.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {draft.customRules.map((rule) => (
                <span
                  key={rule.id}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-fill px-3 py-1.5 text-xs text-ink-2"
                >
                  {rule.kind === "note" ? (
                    <IconSparkle className="h-3 w-3 shrink-0 text-ink-3" strokeWidth={1.6} />
                  ) : (
                    <IconAlertTriangle className="h-3 w-3 shrink-0 text-amber-400" strokeWidth={1.6} />
                  )}
                  {rule.label}
                  {rule.kind === "note" && (
                    <span className="text-[9px] text-ink-3">(advisory)</span>
                  )}
                  <button
                    onClick={() => removeRule(rule.id)}
                    aria-label={`Remove rule: ${rule.label}`}
                    className="text-ink-3 hover:text-red-400"
                  >
                    <IconTrash className="h-3 w-3" strokeWidth={1.8} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={ruleCategory}
              onChange={(e) => setRuleCategory(e.target.value)}
              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-line-strong focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={() => addCategoryRule("exclude-category")}
              className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink-2 hover:border-line-strong hover:text-ink"
            >
              Never bid
            </button>
            <input
              type="number"
              value={ruleCap}
              onChange={(e) => setRuleCap(e.target.value)}
              placeholder="Cap $"
              className="w-24 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-3 focus:border-line-strong focus:outline-none"
            />
            <button
              onClick={() => addCategoryRule("cap-category")}
              className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink-2 hover:border-line-strong hover:text-ink"
            >
              <IconPlus className="h-3 w-3" strokeWidth={1.8} /> Add cap
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addFreeformRule();
            }}
            className="mt-3 flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2"
          >
            <IconSparkle className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
            <input
              value={freeform}
              onChange={(e) => setFreeform(e.target.value)}
              placeholder="Tell your AI any other rule — e.g. &ldquo;never bid on Nissan&rdquo;"
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-3 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-base hover:opacity-90"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs text-ink-3">
        Prototype note: guardrails are saved in this browser and apply to the Live Auctions feed
        and auction bidding — they don&apos;t yet sync across devices or dealership staff.
      </p>
    </div>
  );
}
