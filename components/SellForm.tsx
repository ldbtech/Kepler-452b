"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dealer } from "@/lib/dealers";
import {
  MECHANICAL_ISSUE_LOCATIONS,
  type MechanicalIssue,
  type Vehicle,
} from "@/lib/vehicles";
import { formatUsd, getAiRecommendation } from "@/lib/demo";
import { createOwnerListing } from "@/lib/listings";
import { compressImageFile } from "@/lib/compressImage";
import ConditionGauge from "@/components/ConditionGauge";
import {
  IconAlertTriangle,
  IconCar,
  IconPlus,
  IconSparkle,
  IconTrash,
  IconUpload,
} from "@/components/icons";

const CATEGORY_OPTIONS = ["SEDAN", "AUTOMOBILE", "SUV", "PICKUP", "VAN", "MEDIUM DUTY/BOX TRUCKS"];
const MAX_PHOTOS = 16;

function seedFrom(parts: (string | number)[]): number {
  const s = parts.join("|");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

export default function SellForm({ dealer }: { dealer: Dealer }) {
  const router = useRouter();

  const [sellerName, setSellerName] = useState(dealer.name);
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [color, setColor] = useState("");
  const [odometer, setOdometer] = useState("");
  const [location, setLocation] = useState(dealer.location);
  const [vehicleCategory, setVehicleCategory] = useState("");
  const [bodyStyle, setBodyStyle] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const [issues, setIssues] = useState<MechanicalIssue[]>([]);

  const [pricingMode, setPricingMode] = useState<"ai" | "manual">("ai");
  const [minBid, setMinBid] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const yearNum = Number(year);
  const canPreview =
    make.trim().length > 0 && model.trim().length > 0 && yearNum >= 1980 && yearNum <= 2027;

  const draftVehicle: Vehicle | null = useMemo(() => {
    if (!canPreview) return null;
    return {
      lotNumber: seedFrom([year, make, model, trim, odometer, vehicleCategory, issues.length, pricingMode, minBid]),
      year: yearNum,
      make: make.toUpperCase(),
      model: model.toUpperCase(),
      trim: trim || null,
      color: color || null,
      condition: null,
      damage: issues.length > 0 ? "OWNER REPORTED ISSUES" : "NORMAL WEAR",
      odometer: odometer ? Number(odometer) : null,
      location: location || null,
      bodyStyle: bodyStyle || null,
      vehicleCategory: vehicleCategory || null,
      images: [],
      rotationOrder: [],
      fetchedAt: new Date().toISOString(),
      mechanicalIssues: issues,
      ownerMinBid: pricingMode === "manual" && Number(minBid) > 0 ? Number(minBid) : undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPreview, year, make, model, trim, color, odometer, location, bodyStyle, vehicleCategory, issues, pricingMode, minBid]);

  const aiPreview = draftVehicle ? getAiRecommendation(draftVehicle) : null;

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (images.length + files.length > MAX_PHOTOS) {
      setPhotoError(`Up to ${MAX_PHOTOS} photos — remove a few before adding more.`);
      return;
    }
    setPhotoError(null);
    setCompressing(true);
    try {
      const compressed = await Promise.all(files.map((f) => compressImageFile(f)));
      setImages((prev) => [...prev, ...compressed]);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Couldn't process one of those photos.");
    } finally {
      setCompressing(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function addIssue() {
    setIssues((prev) => [
      ...prev,
      { id: `issue-${Date.now()}-${prev.length}`, location: "Engine", title: "", description: "" },
    ]);
  }

  function updateIssue(id: string, patch: Partial<MechanicalIssue>) {
    setIssues((prev) => prev.map((iss) => (iss.id === id ? { ...iss, ...patch } : iss)));
  }

  function removeIssue(id: string) {
    setIssues((prev) => prev.filter((iss) => iss.id !== id));
  }

  async function handleIssuePhoto(id: string, file: File | undefined) {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1000, 0.7);
      updateIssue(id, { photo: compressed });
    } catch {
      // Best-effort close-up — the issue is still useful without a photo.
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!canPreview) {
      setFormError("Fill in a valid year, make, and model.");
      return;
    }
    if (images.length === 0) {
      setFormError("Add at least one photo of the vehicle.");
      return;
    }
    if (pricingMode === "manual" && !(Number(minBid) > 0)) {
      setFormError("Set a minimum bid, or switch to letting the AI decide.");
      return;
    }
    setSubmitting(true);
    try {
      const vehicle = createOwnerListing({
        sellerName,
        year: yearNum,
        make,
        model,
        trim,
        color,
        odometer: odometer ? Number(odometer) : null,
        location,
        vehicleCategory,
        bodyStyle,
        description,
        images,
        mechanicalIssues: issues.filter((iss) => iss.title.trim() || iss.description.trim()),
        pricingMode,
        minBid: pricingMode === "manual" ? Number(minBid) : undefined,
      });
      router.push(`/listings/${vehicle.lotNumber}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save this listing.");
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fill text-ink">
          <IconCar className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Sell your car</h1>
          <p className="mt-0.5 text-sm text-ink-3">
            List direct to our network of AI dealers — no auction house in between. Prototype
            demo: listings are saved in this browser only.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-8">
          {/* Vehicle info */}
          <Section title="Vehicle details">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Year">
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2019"
                  className={inputClass}
                />
              </Field>
              <Field label="Make">
                <input
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Honda"
                  className={inputClass}
                />
              </Field>
              <Field label="Model">
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Civic"
                  className={inputClass}
                />
              </Field>
              <Field label="Trim (optional)">
                <input
                  value={trim}
                  onChange={(e) => setTrim(e.target.value)}
                  placeholder="EX-L"
                  className={inputClass}
                />
              </Field>
              <Field label="Color">
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Silver"
                  className={inputClass}
                />
              </Field>
              <Field label="Odometer (mi)">
                <input
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder="68000"
                  className={inputClass}
                />
              </Field>
              <Field label="Location">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Phoenix, AZ"
                  className={inputClass}
                />
              </Field>
              <Field label="Category">
                <select
                  value={vehicleCategory}
                  onChange={(e) => setVehicleCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Body style (optional)" className="mt-3">
              <input
                value={bodyStyle}
                onChange={(e) => setBodyStyle(e.target.value)}
                placeholder="4DR Sedan"
                className={inputClass}
              />
            </Field>
            <Field label="Description" className="mt-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Single owner, routine maintenance at the dealer, new tires in 2025…"
                className={`${inputClass} resize-none`}
              />
            </Field>
            <Field label="Your name" className="mt-3">
              <input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Your name or business"
                className={inputClass}
              />
            </Field>
          </Section>

          {/* Photos */}
          <Section title="Photos" subtitle={`${images.length}/${MAX_PHOTOS}`}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-neutral-900">
                  <img src={src} alt={`Vehicle photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <IconTrash className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </button>
                </div>
              ))}
              {images.length < MAX_PHOTOS && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line text-ink-3 hover:border-line-strong hover:text-ink-2">
                  <IconUpload className="h-5 w-5" strokeWidth={1.5} />
                  <span className="text-[10px]">Add photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handlePhotoSelect}
                  />
                </label>
              )}
            </div>
            {compressing && <p className="mt-2 text-xs text-ink-3">Processing photos…</p>}
            {photoError && <p className="mt-2 text-xs text-red-400">{photoError}</p>}
          </Section>

          {/* Mechanical issues */}
          <Section
            title="Mechanical issues"
            subtitle="Optional"
            action={
              <button
                type="button"
                onClick={addIssue}
                className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:border-line-strong hover:text-ink"
              >
                <IconPlus className="h-3.5 w-3.5" strokeWidth={1.6} /> Add issue
              </button>
            }
          >
            <p className="text-xs text-ink-3">
              Disclose anything mechanically wrong — buyers will see each issue with its
              location and a close-up photo if you add one, so there are no surprises after
              the sale.
            </p>
            {issues.length > 0 && (
              <div className="mt-3 flex flex-col gap-3">
                {issues.map((issue) => (
                  <div key={issue.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-start gap-2">
                      <select
                        value={issue.location}
                        onChange={(e) =>
                          updateIssue(issue.id, { location: e.target.value as MechanicalIssue["location"] })
                        }
                        className={`${inputClass} max-w-[170px] shrink-0`}
                      >
                        {MECHANICAL_ISSUE_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                      <input
                        value={issue.title}
                        onChange={(e) => updateIssue(issue.id, { title: e.target.value })}
                        placeholder="Short summary — e.g. Oil leak near valve cover"
                        className={`${inputClass} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => removeIssue(issue.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-fill hover:text-red-400"
                        aria-label="Remove issue"
                      >
                        <IconTrash className="h-4 w-4" strokeWidth={1.6} />
                      </button>
                    </div>
                    <textarea
                      value={issue.description}
                      onChange={(e) => updateIssue(issue.id, { description: e.target.value })}
                      rows={2}
                      placeholder="Describe what's wrong, when it started, any repairs attempted…"
                      className={`${inputClass} mt-2 resize-none`}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      {issue.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={issue.photo}
                          alt="Close-up of the issue"
                          className="h-12 w-16 rounded-md object-cover"
                        />
                      ) : null}
                      <label className="cursor-pointer text-xs text-ink-3 underline hover:text-ink-2">
                        {issue.photo ? "Replace close-up photo" : "Add a close-up photo (optional)"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => handleIssuePhoto(issue.id, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Pricing + AI preview, sticky on large screens */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-20 xl:col-span-4 xl:self-start">
          <Section title="Pricing">
            <div className="flex flex-col gap-2">
              <PricingOption
                selected={pricingMode === "ai"}
                onSelect={() => setPricingMode("ai")}
                title="Let the AI decide"
                description="We'll set a data-driven minimum bid from comparable sales and condition."
              />
              <PricingOption
                selected={pricingMode === "manual"}
                onSelect={() => setPricingMode("manual")}
                title="Set my own minimum bid"
                description="The car won't sell for less than this, no matter what the AI estimates."
              />
            </div>
            {pricingMode === "manual" && (
              <Field label="Minimum bid (USD)" className="mt-3">
                <input
                  type="number"
                  value={minBid}
                  onChange={(e) => setMinBid(e.target.value)}
                  placeholder="9000"
                  className={inputClass}
                />
              </Field>
            )}
          </Section>

          <Section title="AI estimate" subtitle={canPreview ? "Live preview" : undefined}>
            {!aiPreview ? (
              <p className="flex items-center gap-2 text-sm text-ink-3">
                <IconSparkle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                Fill in year, make, and model to see an estimate.
              </p>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <ConditionGauge score={aiPreview.conditionScore} />
                  <div className="flex-1">
                    <div className="text-xs text-ink-3">Estimated market value</div>
                    <div className="text-lg font-semibold text-ink">
                      {formatUsd(aiPreview.estimatedMarketValue)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-surface p-2.5">
                  <div className="text-xs text-ink-3">
                    {pricingMode === "manual" ? "AI-suggested minimum bid" : "AI will list the minimum bid at"}
                  </div>
                  <div className="text-base font-semibold text-emerald-400">
                    {formatUsd(aiPreview.recommendedMaxBid)}
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-2">{aiPreview.reasoning}</p>
                {issues.length > 0 && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-400">
                    <IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                    Disclosed issues lower the estimate and are shown to every bidder.
                  </p>
                )}
              </div>
            )}
          </Section>

          {formError && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/[.06] px-3 py-2 text-xs text-red-400">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || compressing}
            className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-base hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Listing…" : "List my car"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-3 focus:border-line-strong focus:outline-none";

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-ink">{title}</span>
          {subtitle && <span className="text-xs text-ink-3">{subtitle}</span>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-ink-3 ${className ?? ""}`}>
      {label}
      {children}
    </label>
  );
}

function PricingOption({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border p-3 text-left transition-colors ${
        selected ? "border-accent bg-accent/10" : "border-line hover:border-line-strong"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-accent" : "border-line-strong"
          }`}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
        </span>
        <span className="text-sm font-medium text-ink">{title}</span>
      </div>
      <p className="mt-1 pl-6 text-xs text-ink-3">{description}</p>
    </button>
  );
}
