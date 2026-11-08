import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  BedDouble,
  Car,
  Check,
  Clock3,
  Coffee,
  LayoutGrid,
  Pencil,
  Plane,
  Plus,
  Sparkles,
  Sunrise,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listOffers, saveOffer, toggleOffer } from "@/lib/staylift/server";
import { money, priceHint } from "@/lib/staylift/format";
import type { OfferCategory } from "@/lib/staylift/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hotel/offers")({
  loader: () => listOffers(),
  component: OffersPage,
});

const CATEGORY_ICON: Record<string, typeof LayoutGrid> = {
  upgrade: BedDouble,
  breakfast: Coffee,
  late_checkout: Clock3,
  early_checkin: Sunrise,
  parking: Car,
  spa: Sparkles,
  transfer: Plane,
};

const CATEGORY_LABEL: Record<OfferCategory, string> = {
  upgrade: "Room upgrade",
  breakfast: "Breakfast & kitchen",
  late_checkout: "Late checkout",
  early_checkin: "Early check-in",
  parking: "Parking",
  spa: "Spa & wellness",
  transfer: "Transfer",
  fb: "Food & beverage",
};

const CUTOFF_CHOICES = ["3", "6", "12", "24", "48", "72"] as const;

type OfferForm = {
  id?: string;
  name: string;
  shortLabel: string;
  category: OfferCategory;
  description: string;
  /** dollars, as typed */
  price: string;
  unit: "night" | "stay";
  /** "" = unlimited */
  inventory: string;
  /** "" = no cutoff */
  cutoff: string;
  autoApprove: boolean;
  fromRoomTypeId: string;
  toRoomTypeId: string;
};

const BLANK_FORM: OfferForm = {
  name: "",
  shortLabel: "",
  category: "breakfast",
  description: "",
  price: "",
  unit: "stay",
  inventory: "",
  cutoff: "24",
  autoApprove: true,
  fromRoomTypeId: "",
  toRoomTypeId: "",
};

function OffersPage() {
  const { offers, roomTypes, canEdit } = Route.useLoaderData();
  const router = useRouter();
  const [form, setForm] = useState<OfferForm | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggle(id: string, active: boolean) {
    await toggleOffer({ data: { id, active } });
    toast.success(active ? "Offer live." : "Offer paused.");
    await router.invalidate();
  }

  function edit(offer: (typeof offers)[number]) {
    setForm({
      id: offer.id,
      name: offer.name,
      shortLabel: offer.shortLabel,
      category: offer.category,
      description: offer.description,
      price: String(offer.priceCents / 100),
      unit: offer.priceUnit === "night" ? "night" : "stay",
      inventory: offer.inventory === null ? "" : String(offer.inventory),
      cutoff: offer.cutoffHours === null ? "" : String(offer.cutoffHours),
      autoApprove: offer.autoApprove,
      fromRoomTypeId: offer.fromRoomTypeId ?? "",
      toRoomTypeId: offer.toRoomTypeId ?? "",
    });
  }

  async function save() {
    if (!form) return;
    const price = Number(form.price);
    if (form.name.trim().length < 2) {
      toast.error("Give the service a name.");
      return;
    }
    if (form.description.trim().length < 2) {
      toast.error("Add a short description guests will read on their stay page.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Set a price of zero or more.");
      return;
    }
    setBusy(true);
    try {
      await saveOffer({
        data: {
          id: form.id,
          name: form.name.trim(),
          shortLabel: (form.shortLabel.trim() || form.name.trim()).slice(0, 60),
          description: form.description.trim(),
          category: form.category,
          priceCents: Math.round(price * 100),
          priceUnit: form.unit,
          inventory: form.inventory.trim() === "" ? null : Math.max(0, Math.floor(Number(form.inventory))),
          cutoffHours: form.cutoff === "" ? null : Number(form.cutoff),
          autoApprove: form.autoApprove,
          fromRoomTypeId: form.category === "upgrade" && form.fromRoomTypeId ? form.fromRoomTypeId : null,
          toRoomTypeId: form.category === "upgrade" && form.toRoomTypeId ? form.toRoomTypeId : null,
        },
      });
      toast.success(form.id ? "Service updated." : "Added to the stay page.");
      setForm(null);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the service.");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine";

  return (
    <div className="mx-auto max-w-5xl stagger-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Service library</h1>
          <p className="mt-2 max-w-2xl text-stone">
            The library of fulfillable services guests see on their stay page. Start with what the
            house already sells — partner-owned experiences can share this model later.
          </p>
        </div>
        {canEdit ? (
          <Button variant={form ? "outline" : "primary"} onClick={() => setForm(form ? null : { ...BLANK_FORM })}>
            {form ? <X className="size-4" /> : <Plus className="size-4" />}
            {form ? "Close" : "New service"}
          </Button>
        ) : null}
      </div>

      {form ? (
        <section className="mt-6 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-lg font-semibold">
            {form.id ? `Edit “${form.name}”` : "New service"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-stone">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Late checkout"
                maxLength={80}
                className={input}
              />
            </label>
            <label className="block text-sm text-stone">
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as OfferCategory })}
                className={input}
              >
                {(Object.keys(CATEGORY_ICON) as OfferCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-stone">
              Short label <span className="text-xs text-mist">— optional, defaults to the name</span>
              <input
                value={form.shortLabel}
                onChange={(e) => setForm({ ...form, shortLabel: e.target.value })}
                placeholder="House kitchen"
                maxLength={60}
                className={input}
              />
            </label>
            <label className="block text-sm text-stone sm:col-span-2">
              Description <span className="text-xs text-mist">— shown on the guest's stay page</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Keep the room until two. Auto-approved when inventory allows."
                maxLength={300}
                rows={2}
                className={input}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-stone">
                Price ($)
                <input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  inputMode="decimal"
                  placeholder="30"
                  className={input}
                />
              </label>
              <label className="block text-sm text-stone">
                Unit
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value as "night" | "stay" })}
                  className={input}
                >
                  <option value="stay">Per stay</option>
                  <option value="night">Per night</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-stone">
                Inventory <span className="text-xs text-mist">— blank = unlimited</span>
                <input
                  value={form.inventory}
                  onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                  inputMode="numeric"
                  placeholder="Unlimited"
                  className={input}
                />
              </label>
              <label className="block text-sm text-stone">
                Cutoff <span className="text-xs text-mist">— hours before arrival</span>
                <select
                  value={form.cutoff}
                  onChange={(e) => setForm({ ...form, cutoff: e.target.value })}
                  className={input}
                >
                  <option value="">No cutoff</option>
                  {CUTOFF_CHOICES.map((h) => (
                    <option key={h} value={h}>
                      {h}h
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {form.category === "upgrade" && roomTypes.length >= 2 ? (
              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                <label className="block text-sm text-stone">
                  From room type
                  <select
                    value={form.fromRoomTypeId}
                    onChange={(e) => setForm({ ...form, fromRoomTypeId: e.target.value })}
                    className={input}
                  >
                    <option value="">—</option>
                    {roomTypes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-stone">
                  To room type
                  <select
                    value={form.toRoomTypeId}
                    onChange={(e) => setForm({ ...form, toRoomTypeId: e.target.value })}
                    className={input}
                  >
                    <option value="">—</option>
                    {roomTypes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <p className="text-sm text-stone">How the request settles</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { on: true, title: "Instant", note: "Guest claims it; it books itself when inventory allows." },
                    { on: false, title: "Needs approval", note: "Request lands on your desk; you approve or decline." },
                  ] as const
                ).map((opt) => (
                  <button
                    key={String(opt.on)}
                    type="button"
                    onClick={() => setForm({ ...form, autoApprove: opt.on })}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      form.autoApprove === opt.on
                        ? "border-pine bg-moss/60 text-ink"
                        : "border-line bg-cream text-stone hover:text-ink",
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {form.autoApprove === opt.on ? <Check className="size-4 text-pine" /> : null}
                      {opt.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-stone">{opt.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : form.id ? "Save changes" : "Add service"}
            </Button>
          </div>
        </section>
      ) : null}

      <ul className="mt-8 grid gap-3 lg:grid-cols-2">
        {offers.map((offer) => {
          const Icon = CATEGORY_ICON[offer.category] ?? LayoutGrid;
          return (
            <li
              key={offer.id}
              className="flex gap-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-moss text-pine">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold leading-tight">{offer.name}</h2>
                  <Badge tone={offer.active ? "good" : "quiet"}>{offer.active ? "Live" : "Paused"}</Badge>
                  <Badge tone="quiet">
                    {offer.autoApprove
                      ? "Instant"
                      : offer.category === "upgrade"
                        ? "Request · confirmed 72h before arrival"
                        : "Needs approval"}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-stone">{offer.description}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-semibold tabular-nums">
                      {money(offer.priceCents)}
                      {priceHint(offer.priceUnit)}
                    </span>
                    <span className="text-stone">
                      {offer.inventory === null
                        ? " · Unlimited"
                        : ` · ${offer.inventory} left`}
                      {offer.cutoffHours ? ` · Cutoff ${offer.cutoffHours}h` : ""}
                    </span>
                  </p>
                  {canEdit ? (
                    <div className="flex shrink-0 gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => edit(offer)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant={offer.active ? "outline" : "primary"}
                        size="sm"
                        onClick={() => void toggle(offer.id, !offer.active)}
                      >
                        {offer.active ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
