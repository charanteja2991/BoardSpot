import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImageOff, Loader2, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/owner/LocationPicker";
import { BILLBOARD_TYPES, LIGHTING_OPTIONS, PRICE_PERIODS, lightingLabel, typeLabel, periodShort } from "@/lib/domain";
import type { BillboardType, Lighting, PricePeriod } from "@/lib/domain";
import { formatMoney } from "@/lib/format";
import {
  createBillboard,
  updateBillboard,
  uploadBillboardImage,
  ensureOwnerRole,
  type BillboardDraftImage,
  type BillboardInput,
} from "@/lib/owner-queries";

export type WizardInitial = {
  id?: string;
  values: Partial<BillboardInput>;
  images: BillboardDraftImage[];
};

const STEPS = ["Basics", "Location", "Dimensions", "Pricing", "Photos", "Availability", "Review"];

const EMPTY: BillboardInput = {
  title: "",
  description: "",
  billboard_type: "static",
  address: "",
  city: "",
  country: "India",
  latitude: 0,
  longitude: 0,
  width: 0,
  height: 0,
  lighting: "none",
  price: 0,
  currency: "INR",
  price_period: "month",
  available_from: null,
  available_to: null,
  status: "draft",
};

export function BillboardWizard({ initial }: { initial?: WizardInitial }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BillboardInput>({ ...EMPTY, ...(initial?.values ?? {}) });
  const [hasPin, setHasPin] = useState(Boolean(initial?.values?.latitude));
  const [images, setImages] = useState<BillboardDraftImage[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof BillboardInput>(key: K, value: BillboardInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function stepError(index: number): string | null {
    if (index === 0 && !form.title.trim()) return "Give your billboard a title.";
    if (index === 1) {
      if (!form.address.trim()) return "Add the street address.";
      if (!form.city.trim()) return "Add the city.";
      if (!hasPin && (!form.latitude || !form.longitude)) return "Set the map location or enter coordinates.";
    }
    if (index === 2 && (form.width <= 0 || form.height <= 0)) return "Width and height must be greater than zero.";
    if (index === 3 && form.price <= 0) return "Set a price greater than zero.";
    if (index === 5 && form.available_from && form.available_to && form.available_to < form.available_from)
      return "The end date can't be before the start date.";
    return null;
  }

  function next() {
    const error = stepError(step);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadBillboardImage(user.id, file);
        setImages((prev) => [...prev, { ...uploaded, alt_text: form.title || null }]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, direction: -1 | 1) {
    setImages((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target]!, copy[index]!];
      return copy;
    });
  }

  async function save(status: "draft" | "published") {
    if (!user) return;
    for (let i = 0; i < 6; i += 1) {
      const error = stepError(i);
      if (error) {
        toast.error(error);
        setStep(i);
        return;
      }
    }
    setSaving(true);
    try {
      await ensureOwnerRole(user.id);
      const payload: BillboardInput = { ...form, status };
      if (initial?.id) {
        await updateBillboard(initial.id, payload, images);
      } else {
        await createBillboard(user.id, payload, images);
      }
      toast.success(status === "published" ? "Billboard published" : "Draft saved");
      void navigate({ to: "/my-billboards" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the billboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <ol className="flex flex-wrap gap-2 text-xs font-medium">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-full border px-3 py-1.5 transition ${
                index === step
                  ? "border-brand bg-brand text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-brand/40"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-6">
        {step === 0 && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Billboard title</Label>
              <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Highway hoarding near Andheri flyover" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Traffic profile, visibility, nearby landmarks…"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Billboard type</Label>
              <select
                id="type"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.billboard_type}
                onChange={(e) => set("billboard_type", e.target.value as BillboardType)}
              >
                {BILLBOARD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Address / locality</Label>
              <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={form.country} onChange={(e) => set("country", e.target.value)} />
              </div>
            </div>
            <LocationPicker
              lat={hasPin ? form.latitude : null}
              lng={hasPin ? form.longitude : null}
              onChange={(lat, lng) => {
                setHasPin(true);
                setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={form.latitude || ""}
                  onChange={(e) => {
                    setHasPin(true);
                    set("latitude", Number(e.target.value));
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={form.longitude || ""}
                  onChange={(e) => {
                    setHasPin(true);
                    set("longitude", Number(e.target.value));
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="width">Width (ft)</Label>
              <Input id="width" type="number" min="0" step="any" value={form.width || ""} onChange={(e) => set("width", Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="height">Height (ft)</Label>
              <Input id="height" type="number" min="0" step="any" value={form.height || ""} onChange={(e) => set("height", Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lighting">Lighting</Label>
              <select
                id="lighting"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.lighting}
                onChange={(e) => set("lighting", e.target.value as Lighting)}
              >
                {LIGHTING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="price">Price ({form.currency})</Label>
              <Input id="price" type="number" min="0" step="any" value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="period">Pricing period</Label>
              <select
                id="period"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.price_period}
                onChange={(e) => set("price_period", e.target.value as PricePeriod)}
              >
                {PRICE_PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-sm font-medium text-muted-foreground hover:border-brand/50">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? "Uploading…" : "Upload billboard photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No photos yet. The first photo becomes the cover image.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-3">
                {images.map((image, index) => (
                  <li key={image.storage_path ?? image.url} className="overflow-hidden rounded-xl border border-border">
                    <img src={image.url} alt={image.alt_text ?? "Billboard photo"} className="aspect-[4/3] w-full object-cover" />
                    <div className="flex items-center justify-between gap-1 p-2 text-xs">
                      <span className="text-muted-foreground">{index === 0 ? "Cover" : `#${index + 1}`}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => move(index, -1)} className="rounded px-1.5 py-1 hover:bg-muted" aria-label="Move earlier">
                          ←
                        </button>
                        <button type="button" onClick={() => move(index, 1)} className="rounded px-1.5 py-1 hover:bg-muted" aria-label="Move later">
                          →
                        </button>
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                          className="rounded px-1.5 py-1 text-destructive hover:bg-muted"
                          aria-label="Remove photo"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              Set the window when this space is free to book. Leave both dates empty if it is always available.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="from">Available from</Label>
                <Input id="from" type="date" value={form.available_from ?? ""} onChange={(e) => set("available_from", e.target.value || null)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="to">Available until</Label>
                <Input id="to" type="date" value={form.available_to ?? ""} onChange={(e) => set("available_to", e.target.value || null)} />
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="grid gap-4">
            <h2 className="font-display text-lg font-semibold">How your listing will look</h2>
            <div className="overflow-hidden rounded-2xl border border-border">
              {images[0] ? (
                <img src={images[0].url} alt={form.title} className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="grid aspect-[16/9] w-full place-items-center bg-muted text-muted-foreground">
                  <ImageOff className="size-6" />
                </div>
              )}
              <div className="grid gap-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{form.title || "Untitled billboard"}</h3>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    {typeLabel(form.billboard_type)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {[form.address, form.city, form.country].filter(Boolean).join(", ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {form.width}ft × {form.height}ft · {lightingLabel(form.lighting)} · {images.length} photo
                  {images.length === 1 ? "" : "s"}
                </p>
                <p className="font-display text-lg font-semibold">
                  {formatMoney(form.price, form.currency)}
                  <span className="text-xs font-normal text-muted-foreground">{periodShort(form.price_period)}</span>
                </p>
                {form.description ? <p className="text-sm">{form.description}</p> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={saving} onClick={() => void save("draft")}>
                Save as draft
              </Button>
              <Button type="button" disabled={saving} onClick={() => void save("published")}>
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Publish billboard
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Next <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
