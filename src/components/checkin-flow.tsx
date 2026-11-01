/**
 * Online check-in with the capture step (phase B), for the guest's phone, the
 * desk tablet and the QR path. Order is deliberate:
 *   1. arrival time + "celebrating anything?"   (easy, useful to the guest)
 *   2. who's travelling with you                 (room set-up; never contacted)
 *   3. the guest's own contact, verified by code, then three UNTICKED consents
 * Every step can be skipped; check-in completes either way.
 */
import { Link } from "@tanstack/react-router";
import { Check, ChevronLeft, Mail, MessageCircle, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  checkinStep,
  completeCheckin,
  requestPreferenceLink,
  sendCheckinCode,
  startCheckin,
  verifyCheckinCode,
} from "@/lib/staylift/server";
import type {
  AgeBand,
  CaptureSource,
  Celebration,
  CelebrationWhose,
  CheckinState,
  CompanionRelation,
  PartyMember,
} from "@/lib/staylift/types";
import { cn } from "@/lib/utils";

type Purpose = "marketing_email" | "marketing_whatsapp" | "profile_memory";

export type CaptureConfig = {
  market: { id: string; explicitSpecialCategory: boolean; dialCode: string };
  wording: Record<Purpose, string>;
  holidays: { id: string; label: string; when: string }[];
  whatsappAvailable: boolean;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CELEBRATIONS: { id: Celebration | "none"; label: string }[] = [
  { id: "none", label: "Nothing special" },
  { id: "birthday", label: "A birthday" },
  { id: "anniversary", label: "An anniversary" },
  { id: "honeymoon", label: "Honeymoon" },
  { id: "achievement", label: "An achievement" },
  { id: "other", label: "Something else" },
];

const RELATIONS: { id: Exclude<CompanionRelation, "child">; label: string }[] = [
  { id: "partner", label: "Partner" },
  { id: "friend", label: "Friend" },
  { id: "parent", label: "Parent" },
  { id: "sibling", label: "Sibling" },
  { id: "colleague", label: "Colleague" },
  { id: "other", label: "Other" },
];

const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: "0-2", label: "Under 3" },
  { id: "3-12", label: "3–12" },
  { id: "13-17", label: "13–17" },
];

const input = "h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine";

export function CheckinFlow({
  token,
  hotel,
  guestFirstName,
  guests,
  state,
  config,
  source,
  kiosk = false,
  onDone,
}: {
  token: string;
  hotel: string;
  guestFirstName: string;
  guests: number;
  state: CheckinState;
  config: CaptureConfig;
  source: CaptureSource;
  kiosk?: boolean;
  onDone?: () => void;
}) {
  const [step, setStep] = useState<"intro" | "arrival" | "party" | "contact" | "done">(state.completed ? "done" : "intro");
  const [eta, setEta] = useState(state.eta ?? "15:00");
  const [celebration, setCelebration] = useState<Celebration | "none">(state.celebration ?? "none");
  const [whose, setWhose] = useState<CelebrationWhose>(state.celebrationWhose ?? "me");
  const [month, setMonth] = useState<number | null>(state.celebrationMonth);
  const [day, setDay] = useState<number | null>(state.celebrationDay);
  const [party, setParty] = useState<PartyMember[]>(state.party);
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [contact, setContact] = useState("");
  const [pending, setPending] = useState<{ id: string; sentTo: string; devCode?: string } | null>(null);
  const [code, setCode] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(state.verifiedEmail);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(state.verifiedPhone);
  const [consents, setConsents] = useState<Record<Purpose, boolean>>({
    marketing_email: false,
    marketing_whatsapp: false,
    profile_memory: false,
  });
  const [holidays, setHolidays] = useState<string[]>(state.holidays);
  const [busy, setBusy] = useState(false);
  const [prefToken, setPrefToken] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);
  const [linkNote, setLinkNote] = useState<{ sentTo: string | null; devLink?: string } | null>(null);
  const [newProfile, setNewProfile] = useState(false);

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    try {
      return await fn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  const start = () =>
    run(async () => {
      await startCheckin({ data: { token, source } });
      setStep("arrival");
    });

  const afterArrival = () =>
    run(async () => {
      await checkinStep({ data: { token, step: "celebration", source } });
      setStep(guests > 1 ? "party" : "contact");
    });

  const afterParty = () =>
    run(async () => {
      await checkinStep({ data: { token, step: "party", source } });
      setStep("contact");
    });

  const sendCode = () =>
    run(async () => {
      const res = await sendCheckinCode({ data: { token, channel, value: contact, source } });
      setPending({ id: res.verificationId, sentTo: res.sentTo, devCode: res.devCode });
      setCode("");
    });

  const confirmCode = () =>
    run(async () => {
      if (!pending) return;
      const res = await verifyCheckinCode({ data: { token, verificationId: pending.id, code, source } });
      if (!res.ok) {
        toast.error(res.message);
        setCode("");
        return;
      }
      setTicket(res.ticket);
      if (res.channel === "email") setVerifiedEmail(res.masked);
      else setVerifiedPhone(res.masked);
      setPending(null);
      setContact("");
      toast.success("Confirmed.");
    });

  const finish = () =>
    run(async () => {
      const res = await completeCheckin({
        data: {
          token,
          source,
          ticket,
          eta,
          celebration:
            celebration === "none" ? null : { kind: celebration, whose, month, day: month ? day : null },
          party,
          consents,
          holidays: consents.profile_memory ? holidays : [],
        },
      });
      setPrefToken(res.prefToken);
      setNewProfile(res.newProfile);
      setStep("done");
      if (kiosk && onDone) window.setTimeout(onDone, 15_000);
    });

  const emailPreferences = () =>
    run(async () => {
      const res = await requestPreferenceLink({ data: { token, origin: window.location.origin } });
      setLinkNote(res);
    });

  const anyVerified = Boolean(verifiedEmail || verifiedPhone);
  const datable = celebration === "birthday" || celebration === "anniversary" || celebration === "honeymoon" || celebration === "achievement";
  const big = kiosk ? "text-base" : "text-sm";

  if (step === "done") {
    return (
      <div className={cn("rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]", kiosk && "p-8")}>
        <p className="flex items-center gap-2 text-pine">
          <Check className="size-5" /> <span className="font-medium">You're checked in</span>
        </p>
        <ul className={cn("mt-4 space-y-1.5 text-stone", big)}>
          <li>Arriving around {eta || state.eta || "—"}</li>
          {celebration !== "none" ? (
            <li>
              Celebrating {CELEBRATIONS.find((c) => c.id === celebration)?.label.toLowerCase()}
              {month ? ` · ${MONTHS[month - 1]}${day ? ` ${day}` : ""}` : ""} — the house knows.
            </li>
          ) : null}
          {verifiedEmail ? <li>Room details go to {verifiedEmail}</li> : null}
          {verifiedPhone ? <li>WhatsApp: {verifiedPhone}</li> : null}
        </ul>
        {prefToken ? (
          <div className="mt-5 rounded-lg bg-moss p-4 text-sm text-pine">
            {newProfile ? "We've saved your choices." : "Welcome back — we've updated your choices."}{" "}
            <Link to="/p/$token" params={{ token: prefToken }} className="font-medium underline underline-offset-4">
              See or change what we keep
            </Link>
          </div>
        ) : !kiosk && (state.consents.marketing_email || state.consents.marketing_whatsapp || state.consents.profile_memory || state.returningGuest) ? (
          linkNote ? (
            <p className="mt-5 rounded-lg bg-moss p-4 text-sm text-pine">
              {linkNote.sentTo ? `We've emailed a link to ${linkNote.sentTo}.` : "Here's your link."}
              {linkNote.devLink ? (
                <>
                  {" "}
                  <span className="text-amber">Development mode, so nothing was sent:</span>{" "}
                  <a href={linkNote.devLink} className="font-medium underline underline-offset-4">
                    open it
                  </a>
                </>
              ) : null}
            </p>
          ) : (
            <button type="button" onClick={() => void emailPreferences()} disabled={busy} className="mt-5 text-sm font-medium text-pine underline underline-offset-4">
              Email me a link to see or change what you keep
            </button>
          )
        ) : null}
        {kiosk && consents.marketing_email ? (
          <p className="mt-4 text-sm text-stone">You can manage these choices any time from the link on your own stay page.</p>
        ) : null}
        {kiosk && onDone ? (
          <Button size="lg" variant="secondary" className="mt-6 w-full" onClick={onDone}>
            Done — hand the tablet back
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]", kiosk && "p-8")}>
      {step !== "intro" ? (
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-stone hover:text-ink disabled:opacity-0"
            disabled={step === "arrival"}
            onClick={() => setStep(step === "contact" ? (guests > 1 ? "party" : "arrival") : "arrival")}
          >
            <ChevronLeft className="size-4" /> Back
          </button>
          <StepDots step={step} withParty={guests > 1} />
        </div>
      ) : null}

      {step === "intro" ? (
        <>
          <h2 className={cn("font-display font-medium", kiosk ? "text-3xl" : "text-xl")}>
            {kiosk ? `Welcome, ${guestFirstName}` : "Complete your check-in"}
          </h2>
          <p className={cn("mt-2 text-stone", big)}>Three quick questions, about a minute. Skip anything you like.</p>
          <Button size={kiosk ? "lg" : "md"} className="mt-5 w-full" onClick={() => void start()} disabled={busy}>
            Start check-in
          </Button>
        </>
      ) : null}

      {step === "arrival" ? (
        <>
          <h2 className={cn("font-display font-medium", kiosk ? "text-2xl" : "text-xl")}>Your arrival</h2>
          <label className={cn("mt-4 block text-stone", big)}>
            Roughly when will you get here?
            <input type="time" value={eta} onChange={(e) => setEta(e.target.value)} className={cn(input, "mt-1")} />
          </label>
          <fieldset className="mt-5">
            <legend className={cn("text-stone", big)}>Celebrating anything this stay?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CELEBRATIONS.map((c) => (
                <Chip key={c.id} active={celebration === c.id} onClick={() => setCelebration(c.id)} large={kiosk}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          {celebration !== "none" && celebration !== "honeymoon" ? (
            <fieldset className="mt-4">
              <legend className={cn("text-stone", big)}>Whose?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["me", "partner", "someone"] as const).map((w) => (
                  <Chip key={w} active={whose === w} onClick={() => setWhose(w)} large={kiosk}>
                    {w === "me" ? "Mine" : w === "partner" ? "My partner's" : "Someone else's"}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ) : null}
          {datable ? (
            <div className="mt-4">
              <p className={cn("text-stone", big)}>
                {celebration === "honeymoon" ? "Wedding date" : "The date"} <span className="text-mist">(optional)</span>
              </p>
              <div className="mt-1 grid grid-cols-[1fr_96px] gap-2">
                <select aria-label="Month" value={month ?? ""} onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)} className={input}>
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select aria-label="Day" value={day ?? ""} onChange={(e) => setDay(e.target.value ? Number(e.target.value) : null)} className={input} disabled={!month}>
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-mist">Only the month and day — never the year.</p>
            </div>
          ) : null}
          <Button size={kiosk ? "lg" : "md"} className="mt-6 w-full" onClick={() => void afterArrival()} disabled={busy}>
            Continue
          </Button>
        </>
      ) : null}

      {step === "party" ? (
        <>
          <h2 className={cn("font-display font-medium", kiosk ? "text-2xl" : "text-xl")}>Who's with you?</h2>
          <p className={cn("mt-1 text-stone", big)}>
            So we can set up the room. We never contact the people you add.
          </p>
          <ul className="mt-4 space-y-2">
            {party.map((m, i) => (
              <li key={i} className="flex items-center gap-2">
                {m.relation === "child" ? (
                  <>
                    <span className="w-24 shrink-0 text-sm text-stone">Child</span>
                    <select
                      aria-label="Age"
                      value={m.ageBand}
                      onChange={(e) => setParty(party.map((p, j) => (j === i ? { relation: "child", ageBand: e.target.value as AgeBand } : p)))}
                      className={input}
                    >
                      {AGE_BANDS.map((a) => (
                        <option key={a.id} value={a.id}>
                          Age {a.label}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <select
                      aria-label="Relation"
                      value={m.relation}
                      onChange={(e) =>
                        setParty(party.map((p, j) => (j === i ? { relation: e.target.value as Exclude<CompanionRelation, "child">, firstName: m.firstName } : p)))
                      }
                      className={cn(input, "w-32 shrink-0")}
                    >
                      {RELATIONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label="First name"
                      placeholder="First name"
                      value={m.firstName}
                      maxLength={40}
                      onChange={(e) => setParty(party.map((p, j) => (j === i ? { relation: m.relation, firstName: e.target.value } : p)))}
                      className={input}
                    />
                  </>
                )}
                <button type="button" aria-label="Remove" onClick={() => setParty(party.filter((_, j) => j !== i))} className="flex size-11 shrink-0 items-center justify-center rounded-md text-stone hover:bg-cream">
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setParty([...party, { relation: party.some((p) => p.relation === "partner") ? "friend" : "partner", firstName: "" }])} disabled={party.length >= 8}>
              <Plus className="size-4" /> Adult
            </Button>
            <Button size="sm" variant="outline" onClick={() => setParty([...party, { relation: "child", ageBand: "3-12" }])} disabled={party.length >= 8}>
              <Plus className="size-4" /> Child
            </Button>
          </div>
          <p className="mt-2 text-xs text-mist">Children are kept as an age range only, without a name.</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="ghost" size={kiosk ? "lg" : "md"} onClick={() => { setParty([]); void afterParty(); }} disabled={busy}>
              Skip
            </Button>
            <Button size={kiosk ? "lg" : "md"} onClick={() => { setParty(party.filter((p) => p.relation === "child" || p.firstName.trim())); void afterParty(); }} disabled={busy}>
              Continue
            </Button>
          </div>
        </>
      ) : null}

      {step === "contact" ? (
        <>
          <h2 className={cn("font-display font-medium", kiosk ? "text-2xl" : "text-xl")}>Stay in touch</h2>
          <p className={cn("mt-1 text-stone", big)}>
            Booking sites hide your address, so messages from the house can go astray. Add your own and we'll send room
            details there.
          </p>

          {verifiedEmail || verifiedPhone ? (
            <ul className="mt-4 space-y-1.5">
              {verifiedEmail ? (
                <li className="flex items-center gap-2 text-sm text-pine">
                  <Check className="size-4" /> {verifiedEmail}
                </li>
              ) : null}
              {verifiedPhone ? (
                <li className="flex items-center gap-2 text-sm text-pine">
                  <Check className="size-4" /> WhatsApp {verifiedPhone}
                </li>
              ) : null}
            </ul>
          ) : null}

          {!(verifiedEmail && (verifiedPhone || !config.whatsappAvailable)) ? (
            <div className="mt-4 rounded-lg bg-cream p-3">
              {config.whatsappAvailable ? (
                <div className="mb-3 inline-flex rounded-md bg-paper p-1" role="tablist">
                  {(["email", "whatsapp"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="tab"
                      aria-selected={channel === c}
                      disabled={(c === "email" && Boolean(verifiedEmail)) || (c === "whatsapp" && Boolean(verifiedPhone))}
                      onClick={() => { setChannel(c); setPending(null); setContact(""); }}
                      className={cn("inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-sm disabled:opacity-40", channel === c ? "bg-pine text-pine-fg" : "text-stone")}
                    >
                      {c === "email" ? <Mail className="size-3.5" /> : <MessageCircle className="size-3.5" />}
                      {c === "email" ? "Email" : "WhatsApp"}
                    </button>
                  ))}
                </div>
              ) : null}
              {!pending ? (
                <div className="flex gap-2">
                  <input
                    aria-label={channel === "email" ? "Your email" : "Your WhatsApp number"}
                    type={channel === "email" ? "email" : "tel"}
                    inputMode={channel === "email" ? "email" : "tel"}
                    autoComplete={channel === "email" ? "email" : "tel"}
                    placeholder={channel === "email" ? "you@example.com" : config.market.dialCode ? `+${config.market.dialCode} …` : "+49 …"}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className={input}
                  />
                  <Button onClick={() => void sendCode()} disabled={busy || contact.trim().length < 5} className="shrink-0">
                    Send code
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-stone">Enter the 6-digit code we sent to {pending.sentTo}.</p>
                  {pending.devCode ? (
                    <p className="mt-2 rounded-md bg-amber-soft px-3 py-2 text-xs text-amber">
                      Development mode — nothing was sent. The code is <strong className="font-mono">{pending.devCode}</strong>.
                    </p>
                  ) : null}
                  <div className="mt-2 flex gap-2">
                    <input
                      aria-label="Code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className={cn(input, "font-mono tracking-[0.3em]")}
                    />
                    <Button onClick={() => void confirmCode()} disabled={busy || code.length !== 6} className="shrink-0">
                      Confirm
                    </Button>
                  </div>
                  <button type="button" onClick={() => setPending(null)} className="mt-2 text-xs text-stone underline">
                    Use a different {channel === "email" ? "email" : "number"}
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <fieldset className="mt-5 space-y-3">
            <legend className="text-xs uppercase tracking-[0.14em] text-stone">Optional — nothing is ticked for you</legend>
            <Consent
              checked={consents.marketing_email}
              disabled={!verifiedEmail}
              hint={!verifiedEmail ? "Confirm an email first" : undefined}
              onChange={(v) => setConsents({ ...consents, marketing_email: v })}
              text={config.wording.marketing_email}
            />
            <Consent
              checked={consents.marketing_whatsapp}
              disabled={!verifiedPhone}
              hint={!verifiedPhone ? "Confirm a WhatsApp number first" : undefined}
              onChange={(v) => setConsents({ ...consents, marketing_whatsapp: v })}
              text={config.wording.marketing_whatsapp}
            />
            <Consent
              checked={consents.profile_memory}
              disabled={!anyVerified}
              hint={!anyVerified ? "Confirm an email or number first" : undefined}
              onChange={(v) => setConsents({ ...consents, profile_memory: v })}
              text={config.wording.profile_memory}
            />
          </fieldset>

          {consents.profile_memory ? (
            <div className="mt-4 rounded-lg bg-cream p-3">
              <p className="flex items-center gap-1.5 text-sm text-ink">
                <Sparkles className="size-4 text-pine" /> Any holidays you'd like us to remember?
              </p>
              <p className="mt-1 text-xs text-stone">
                Entirely up to you{config.market.explicitSpecialCategory ? " — this can say something about your faith or culture, so we only keep what you pick" : ""}.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {config.holidays.map((h) => (
                  <Chip
                    key={h.id}
                    small
                    active={holidays.includes(h.id)}
                    onClick={() => setHolidays(holidays.includes(h.id) ? holidays.filter((x) => x !== h.id) : [...holidays, h.id])}
                  >
                    {h.label}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          <Button size={kiosk ? "lg" : "md"} className="mt-6 w-full" onClick={() => void finish()} disabled={busy || Boolean(pending)}>
            {busy ? "Saving…" : anyVerified ? "Finish check-in" : "Skip and finish check-in"}
          </Button>
          <p className="mt-2 text-center text-xs text-mist">You can change or withdraw any of this later.</p>
        </>
      ) : null}
    </div>
  );
}

function StepDots({ step, withParty }: { step: string; withParty: boolean }) {
  const steps = withParty ? ["arrival", "party", "contact"] : ["arrival", "contact"];
  return (
    <span className="flex items-center gap-1.5" aria-label={`Step ${steps.indexOf(step) + 1} of ${steps.length}`}>
      {steps.map((s) => (
        <span key={s} className={cn("h-1.5 rounded-full transition-all", s === step ? "w-5 bg-pine" : "w-1.5 bg-line")} />
      ))}
    </span>
  );
}

function Chip({
  active,
  onClick,
  children,
  small,
  large,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border transition-colors",
        small ? "h-8 px-3 text-xs" : large ? "h-12 px-5 text-base" : "h-10 px-4 text-sm",
        active ? "border-pine bg-pine text-pine-fg" : "border-line bg-paper text-ink hover:bg-cream",
      )}
    >
      {children}
    </button>
  );
}

function Consent({
  checked,
  disabled,
  hint,
  onChange,
  text,
}: {
  checked: boolean;
  disabled: boolean;
  hint?: string;
  onChange: (v: boolean) => void;
  text: string;
}) {
  return (
    <label className={cn("flex items-start gap-3 text-sm", disabled && "opacity-50")}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-pine"
      />
      <span>
        {text}
        {hint ? <Badge className="ml-2 align-middle">{hint}</Badge> : null}
      </span>
    </label>
  );
}
