import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DEFAULT_OPERATOR,
  INPUT_BOUNDS,
  MESSAGE_RATES,
  PLANS,
  SCENARIOS,
  computeHotel,
  computeOperator,
  customPlan,
  matchScenario,
  messageRate,
  netCurve,
  pricingRule,
  withScenario,
  type HotelInputs,
  type HotelResult,
  type MarketId,
  type OperatorInputs,
  type Plan,
  type ScenarioId,
} from "@/lib/staylift/roi";
import { DEFAULT_STATE, type CalculatorState, type CalculatorTab } from "@/lib/staylift/roi-url";
import { count, pctOf, usd } from "@/lib/staylift/format";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Public component                                                            */
/* -------------------------------------------------------------------------- */

export function RoiCalculator({
  initial,
  onChange,
  context,
  shareable = true,
}: {
  initial?: CalculatorState;
  /** false where the page URL isn't the share URL (e.g. embedded in a frame) */
  shareable?: boolean;
  onChange?: (state: CalculatorState) => void;
  /** optional banner above the calculator (e.g. "seeded from measured pilot") */
  context?: ReactNode;
}) {
  const [state, setState] = useState<CalculatorState>(initial ?? DEFAULT_STATE);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange?.(state);
  }, [state, onChange]);

  const setInputs = (patch: Partial<HotelInputs>) =>
    setState((s) => ({ ...s, inputs: { ...s.inputs, ...patch } }));
  const setPlan = (plan: Plan) => setState((s) => ({ ...s, plan }));
  const setOperator = (patch: Partial<OperatorInputs>) =>
    setState((s) => ({ ...s, operator: { ...s.operator, ...patch } }));
  const setTab = (tab: CalculatorTab) => setState((s) => ({ ...s, tab }));

  const hotel = useMemo(() => computeHotel(state.inputs, state.plan), [state.inputs, state.plan]);

  return (
    <div className="space-y-6">
      {context}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Calculator view" className="inline-flex rounded-lg bg-cream p-1 shadow-[var(--shadow-border)]">
          <TabButton active={state.tab === "hotel"} onClick={() => setTab("hotel")}>
            Hotel ROI
          </TabButton>
          <TabButton active={state.tab === "operator"} onClick={() => setTab("operator")}>
            Staylift unit economics
          </TabButton>
        </div>
        <div className="flex gap-2">
          {shareable ? <CopyLink /> : null}
          <button
            type="button"
            onClick={() => setState({ ...DEFAULT_STATE, tab: state.tab })}
            className="h-9 rounded-sm px-3 text-sm text-stone transition-colors hover:bg-cream hover:text-ink"
          >
            Reset
          </button>
        </div>
      </div>

      {state.tab === "hotel" ? (
        <HotelView
          inputs={state.inputs}
          plan={state.plan}
          hotel={hotel}
          setInputs={setInputs}
          setPlan={setPlan}
        />
      ) : (
        <OperatorView
          hotel={hotel}
          plan={state.plan}
          rooms={state.inputs.rooms}
          operator={state.operator}
          setOperator={setOperator}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hotel view                                                                  */
/* -------------------------------------------------------------------------- */

const FIELD_COPY: Record<keyof HotelInputs, { label: string; unit?: string; help: string }> = {
  rooms: { label: "Rooms", help: "Sellable rooms." },
  occupancyPct: { label: "Occupancy", unit: "%", help: "Average over the year." },
  avgStayNights: { label: "Average stay", unit: "nights", help: "Length of stay per booking." },
  reachablePct: {
    label: "Reachable",
    unit: "% of bookings",
    help: "Have a working channel: OTA relay, real email or a valid phone.",
  },
  viewPct: {
    label: "Open the stay page",
    unit: "% of reachable",
    help: "Click the check-in link and see the offers.",
  },
  buyPct: {
    label: "Buy something",
    unit: "% of viewers",
    help: "Viewers who pay for at least one offer.",
  },
  avgSpend: {
    label: "Spend per buying booking",
    unit: "$",
    help: "Total add-on revenue per booking that buys.",
  },
  ordersPerBuyer: {
    label: "Orders per buying booking",
    help: "Only matters for the fixed card fee.",
  },
  marginPct: {
    label: "Contribution margin",
    unit: "%",
    help: "What's left of an add-on dollar after the cost to deliver it.",
  },
  incrementalityPct: {
    label: "Incrementality",
    unit: "%",
    help: "Share of page sales that would NOT have happened at the desk anyway. Measure it with a holdout.",
  },
  cardPct: { label: "Card processing", unit: "%", help: "Blended card cost on page sales." },
  cardFixed: { label: "Card fee per order", unit: "$", help: "Fixed per-transaction fee, if any." },
};

function HotelView({
  inputs,
  plan,
  hotel,
  setInputs,
  setPlan,
}: {
  inputs: HotelInputs;
  plan: Plan;
  hotel: HotelResult;
  setInputs: (patch: Partial<HotelInputs>) => void;
  setPlan: (plan: Plan) => void;
}) {
  const scenario = matchScenario(inputs);
  const rule = useMemo(() => pricingRule(inputs, plan), [inputs, plan]);
  const field = (key: keyof HotelInputs) => (
    <NumberField
      key={key}
      id={`roi-${key}`}
      label={FIELD_COPY[key].label}
      unit={FIELD_COPY[key].unit}
      help={FIELD_COPY[key].help}
      value={inputs[key]}
      {...INPUT_BOUNDS[key]}
      onChange={(v) => setInputs({ [key]: v })}
    />
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
        <div className="space-y-5">
          <Panel title="Your hotel" aside={`≈ ${count(hotel.bookings)} bookings a year`}>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-3">
              {field("rooms")}
              {field("occupancyPct")}
              {field("avgStayNights")}
            </div>
          </Panel>

          <Panel
            title="Guest funnel"
            aside={`${pctOf(hotel.conversionOfReachable)} of reachable bookings buy`}
          >
            <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Scenario">
              {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
                <Chip
                  key={id}
                  active={scenario === id}
                  onClick={() => setInputs(withScenarioPatch(id))}
                  title={SCENARIOS[id].blurb}
                >
                  {SCENARIOS[id].label}
                </Chip>
              ))}
              <span
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-3 text-xs",
                  scenario ? "text-mist" : "bg-amber-soft text-amber",
                )}
              >
                {scenario ? SCENARIOS[scenario].blurb : "Your own numbers"}
              </span>
            </div>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {field("reachablePct")}
              {field("viewPct")}
              {field("buyPct")}
              {field("avgSpend")}
            </div>
          </Panel>

          <Panel title="Hotel economics">
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {field("marginPct")}
              {field("incrementalityPct")}
              {field("cardPct")}
              {field("cardFixed")}
              {field("ordersPerBuyer")}
            </div>
          </Panel>

          <Panel title="Staylift price" aside={pctOf(hotel.effectiveTakeRate) + " of upsell revenue, all-in"}>
            <PlanPicker plan={plan} rooms={inputs.rooms} setPlan={setPlan} />
          </Panel>
        </div>

        <div id="roi-result">
          <ResultCard hotel={hotel} plan={plan} rule={rule} />
        </div>
      </div>

      <a
        href="#roi-result"
        className="fixed inset-x-3 bottom-3 z-20 flex items-center justify-between gap-3 rounded-lg bg-pine px-4 py-3 text-pine-fg shadow-[var(--shadow-lift)] lg:hidden"
      >
        <span className="text-xs uppercase tracking-[0.14em] text-pine-fg/75">Hotel net / year</span>
        <span className="font-display text-xl tabular-nums">
          {usd(hotel.hotelNet, { sign: true })}
          <span className="ml-2 font-sans text-xs text-pine-fg/75">
            {hotel.totalCost > 0 ? `${Math.round(hotel.roi * 100)}% ROI` : ""}
          </span>
        </span>
      </a>

      <PlanComparison inputs={inputs} plan={plan} setPlan={setPlan} />
      <SensitivityChart inputs={inputs} plan={plan} hotel={hotel} />
      <Method />
    </>
  );
}

function withScenarioPatch(id: ScenarioId): Partial<HotelInputs> {
  const s = SCENARIOS[id];
  return { viewPct: s.viewPct, buyPct: s.buyPct, avgSpend: s.avgSpend };
}

function PlanPicker({
  plan,
  rooms,
  setPlan,
}: {
  plan: Plan;
  rooms: number;
  setPlan: (p: Plan) => void;
}) {
  const options = [PLANS.A, PLANS.B, PLANS.C];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Pricing plan">
        {options.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={plan.id === p.id}
            onClick={() => setPlan(p)}
            className={cn(
              "rounded-md px-3 py-2.5 text-left text-sm transition-colors",
              plan.id === p.id
                ? "bg-pine text-pine-fg"
                : "bg-cream text-ink shadow-[var(--shadow-border)] hover:bg-paper",
            )}
          >
            <span className="block font-medium">{p.name.split(" · ")[0]}</span>
            <span className={cn("block text-xs", plan.id === p.id ? "text-pine-fg/80" : "text-stone")}>
              {planSummary(p)}
            </span>
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={plan.id === "custom"}
          onClick={() =>
            setPlan(
              plan.id === "custom"
                ? plan
                : customPlan(plan.perRoomMonthly, plan.baseMonthly, plan.revSharePct),
            )
          }
          className={cn(
            "rounded-md px-3 py-2.5 text-left text-sm transition-colors",
            plan.id === "custom"
              ? "bg-pine text-pine-fg"
              : "bg-cream text-ink shadow-[var(--shadow-border)] hover:bg-paper",
          )}
        >
          <span className="block font-medium">Custom</span>
          <span className={cn("block text-xs", plan.id === "custom" ? "text-pine-fg/80" : "text-stone")}>
            Your own mix
          </span>
        </button>
      </div>
      {plan.id === "custom" ? (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-3">
          <NumberField
            id="roi-prr"
            label="Per room / month"
            unit="$"
            value={plan.perRoomMonthly}
            min={0}
            max={20}
            step={0.5}
            onChange={(v) => setPlan(customPlan(v, plan.baseMonthly, plan.revSharePct))}
          />
          <NumberField
            id="roi-pbase"
            label="Base / month"
            unit="$"
            value={plan.baseMonthly}
            min={0}
            max={500}
            step={5}
            onChange={(v) => setPlan(customPlan(plan.perRoomMonthly, v, plan.revSharePct))}
          />
          <NumberField
            id="roi-pshare"
            label="Revenue share"
            unit="%"
            value={plan.revSharePct}
            min={0}
            max={30}
            step={0.5}
            onChange={(v) => setPlan(customPlan(plan.perRoomMonthly, plan.baseMonthly, v))}
          />
        </div>
      ) : (
        <p className="text-sm text-stone">
          {plan.note} For {count(rooms)} rooms the fixed part is{" "}
          {usd((plan.perRoomMonthly * rooms + plan.baseMonthly) * 12)} a year.
        </p>
      )}
    </div>
  );
}

function planSummary(p: Plan) {
  const parts: string[] = [];
  if (p.perRoomMonthly) parts.push(`$${p.perRoomMonthly}/room/mo`);
  if (p.baseMonthly) parts.push(`$${p.baseMonthly}/mo`);
  if (p.revSharePct) parts.push(`${p.revSharePct}%`);
  return parts.join(" + ") || "Free";
}

function ResultCard({
  hotel,
  plan,
  rule,
}: {
  hotel: HotelResult;
  plan: Plan;
  rule: ReturnType<typeof pricingRule>;
}) {
  const positive = hotel.hotelNet >= 0;
  return (
    <aside className="rounded-xl bg-pine p-5 text-pine-fg sm:p-6 lg:sticky lg:top-6" aria-live="polite">
      <p className="text-xs uppercase tracking-[0.18em] text-pine-fg/70">Hotel net gain per year</p>
      <p className="mt-3 font-display text-5xl font-medium tabular-nums tracking-tight">
        {usd(hotel.hotelNet, { sign: true })}
      </p>
      <p className="mt-2 text-sm text-pine-fg/80">
        {positive ? (
          <>
            {hotel.roi >= 0 ? `${Math.round(hotel.roi * 100)}% ROI` : ""} ·{" "}
            {usd(hotel.returnPerDollar, { cents: true })} of margin per $1 of fees
          </>
        ) : (
          <>Costs more than the margin it creates at these inputs.</>
        )}
      </p>

      <dl className="mt-6 space-y-2 text-sm">
        <Line k="Upsell revenue through the page" v={usd(hotel.gross)} />
        <Line k="Would have sold anyway" v={`−${usd(hotel.baselineRevenue)}`} muted />
        <Line k="Incremental revenue" v={usd(hotel.incrementalRevenue)} strong />
        <Line k="× contribution margin" v={usd(hotel.incrementalContribution)} />
        <Line
          k={`Staylift fees (${plan.id === "custom" ? "custom" : `plan ${plan.id}`})`}
          v={`−${usd(hotel.platformFees)}`}
        />
        <Line k="Card processing" v={`−${usd(hotel.cardFees)}`} />
        <div className="my-2 border-t border-pine-fg/20" />
        <Line k="Net to the hotel" v={usd(hotel.hotelNet, { sign: true })} strong />
        <Line k="Per booking" v={usd(hotel.netPerBooking, { sign: true, cents: true })} muted />
      </dl>

      <ul className="mt-6 space-y-2 text-sm">
        <Check ok={rule.conservativeOk}>
          Positive in the conservative case ({usd(rule.conservative.hotelNet, { sign: true })})
        </Check>
        <Check ok={rule.baseOk}>
          ≥ $2 of margin per $1 of fees in the base case (
          {usd(rule.base.returnPerDollar, { cents: true })})
        </Check>
        <Check ok={hotel.guarantee.passes}>
          Guarantee: incremental revenue ≥ 2× fees ({usd(hotel.guarantee.lift)} vs{" "}
          {usd(hotel.guarantee.threshold)})
        </Check>
      </ul>

      <p className="mt-5 rounded-md bg-pine-fg/10 px-3 py-2.5 text-xs leading-relaxed text-pine-fg/85">
        {hotel.breakEven
          ? hotel.breakEven.buyers <= 0.5
            ? "Breaks even from the first sale: there is no fixed fee to cover."
            : `Breaks even at ${count(hotel.breakEven.buyers)} buying bookings a year — ${pctOf(
                hotel.breakEven.conversionOfReachable,
              )} of reachable bookings (${pctOf(hotel.breakEven.buyPct / 100)} of viewers).`
          : "Never breaks even: each sale costs more in fees than the incremental margin it adds."}
      </p>
    </aside>
  );
}

function Line({ k, v, strong, muted }: { k: string; v: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={cn(muted ? "text-pine-fg/60" : "text-pine-fg/80")}>{k}</dt>
      <dd className={cn("tabular-nums", strong && "font-medium", muted && "text-pine-fg/60")}>{v}</dd>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          ok ? "bg-pine-fg text-pine" : "bg-rose-soft text-rose",
        )}
      >
        {ok ? "✓" : "!"}
      </span>
      <span className="text-pine-fg/90">
        <span className="sr-only">{ok ? "Passes: " : "Fails: "}</span>
        {children}
      </span>
    </li>
  );
}

/* ----------------------------------------------------- plan × scenario table */

function PlanComparison({
  inputs,
  plan,
  setPlan,
}: {
  inputs: HotelInputs;
  plan: Plan;
  setPlan: (p: Plan) => void;
}) {
  const plans = plan.id === "custom" ? [PLANS.A, PLANS.B, PLANS.C, plan] : [PLANS.A, PLANS.B, PLANS.C];
  const scenarios = Object.keys(SCENARIOS) as ScenarioId[];
  const rows = plans.map((p) => ({
    plan: p,
    cells: scenarios.map((s) => computeHotel(withScenario(inputs, s), p)),
    rule: pricingRule(inputs, p),
  }));

  return (
    <Panel
      title="Every plan, every scenario"
      aside="Hotel net per year · your hotel, your economics"
    >
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-stone">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-medium">Plan</th>
              {scenarios.map((s) => (
                <th key={s} className="px-3 py-2 text-right font-medium">
                  {SCENARIOS[s].label}
                </th>
              ))}
              <th className="py-2 pl-3 text-right font-medium">Pricing rule</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ plan: p, cells, rule }) => {
              const selected = p.id === plan.id;
              return (
                <tr
                  key={p.id}
                  className={cn("border-b border-line last:border-0", selected && "bg-moss/60")}
                >
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      onClick={() => setPlan(p)}
                      className="text-left hover:underline"
                      aria-pressed={selected}
                    >
                      <span className="font-medium">{p.id === "custom" ? "Custom" : `Plan ${p.id}`}</span>
                      <span className="block text-xs text-stone">{planSummary(p)}</span>
                    </button>
                  </td>
                  {cells.map((c, i) => (
                    <td key={scenarios[i]} className="px-3 py-3 text-right tabular-nums">
                      <span className={cn(c.hotelNet < 0 ? "text-rose" : "text-ink")}>
                        {usd(c.hotelNet, { sign: true })}
                      </span>
                      <span className="block text-xs text-stone">
                        {c.totalCost > 0 ? `${Math.round(c.roi * 100)}% ROI` : "—"}
                      </span>
                    </td>
                  ))}
                  <td className="py-3 pl-3 text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        rule.passes ? "bg-moss text-pine" : "bg-rose-soft text-rose",
                      )}
                    >
                      {rule.passes ? "Passes" : !rule.conservativeOk ? "Loses money (cons.)" : "< 2:1 (base)"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone">
        Rule: the hotel must net a positive return in the conservative case and get at least $2
        of incremental margin per $1 of fees in the base case. Scenarios change only the funnel
        (open, buy, spend); hotel size and economics stay yours.
      </p>
    </Panel>
  );
}

/* --------------------------------------------------------- sensitivity chart */

const SERIES: { id: "A" | "B" | "C" | "custom"; color: string; dash?: string }[] = [
  { id: "A", color: "var(--series-a)" },
  { id: "B", color: "var(--series-b)", dash: "6 4" },
  { id: "C", color: "var(--series-c)", dash: "2 3" },
  { id: "custom", color: "var(--color-ink)", dash: "10 3 2 3" },
];

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

function niceStep(range: number, target: number) {
  const raw = range / Math.max(1, target);
  const pow = 10 ** Math.floor(Math.log10(raw));
  const m = raw / pow;
  return (m >= 5 ? 10 : m >= 2 ? 5 : m >= 1 ? 2 : 1) * pow;
}

function SensitivityChart({
  inputs,
  plan,
  hotel,
}: {
  inputs: HotelInputs;
  plan: Plan;
  hotel: HotelResult;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);

  const maxConv = Math.max(0.15, Math.ceil((hotel.conversionOfReachable * 1.6) / 0.05) * 0.05);
  const plans = plan.id === "custom" ? [PLANS.A, PLANS.B, PLANS.C, plan] : [PLANS.A, PLANS.B, PLANS.C];
  const lines = plans.map((p) => ({
    plan: p,
    style: SERIES.find((s) => s.id === p.id) ?? SERIES[0],
    points: netCurve(inputs, p, maxConv, 60),
  }));

  const all = lines.flatMap((l) => l.points.map((pt) => pt.net));
  const yMinRaw = Math.min(0, ...all);
  const yMaxRaw = Math.max(0, ...all);
  const step = niceStep(yMaxRaw - yMinRaw || 1, 5);
  const yMin = Math.floor(yMinRaw / step) * step;
  const yMax = Math.ceil(yMaxRaw / step) * step;

  const height = width < 480 ? 240 : 300;
  const pad = { l: width < 480 ? 48 : 60, r: width < 480 ? 54 : 74, t: 16, b: 36 };
  const iw = Math.max(10, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const x = (c: number) => pad.l + (c / maxConv) * iw;
  const y = (v: number) => pad.t + ((yMax - v) / (yMax - yMin || 1)) * ih;

  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + step / 2; v += step) yTicks.push(v);
  const xStep = maxConv > 0.2 ? 0.05 : 0.025;
  const xTicks: number[] = [];
  for (let c = 0; c <= maxConv + 1e-9; c += xStep) xTicks.push(c);

  const hoverIdx = hover === null ? null : Math.round((hover / maxConv) * 60);
  const current = hotel.conversionOfReachable;

  // Direct labels at the right edge, nudged apart so they never collide.
  const labels = lines
    .map((l) => ({ id: l.plan.id, color: l.style.color, y: y(l.points[l.points.length - 1].net) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i += 1) {
    if (labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
  }

  return (
    <Panel
      title="Where each plan breaks even"
      aside={
        <button
          type="button"
          onClick={() => setAsTable((t) => !t)}
          className="text-xs text-stone underline-offset-2 hover:text-ink hover:underline"
        >
          {asTable ? "Show chart" : "Show as table"}
        </button>
      }
    >
      <p className="-mt-2 mb-4 text-sm text-stone">
        Hotel net per year as conversion (buyers ÷ reachable bookings) changes. Everything else
        stays at your inputs. The vertical line is where you are now.
      </p>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone" aria-hidden={asTable}>
        {lines.map((l) => (
          <span key={l.plan.id} className="inline-flex items-center gap-2">
            <svg width="24" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="24" y2="4" stroke={l.style.color} strokeWidth="2" strokeDasharray={l.style.dash} />
            </svg>
            {l.plan.id === "custom" ? "Custom" : `Plan ${l.plan.id}`} · {planSummary(l.plan)}
          </span>
        ))}
      </div>

      <div ref={ref}>
      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-right text-sm tabular-nums">
            <thead className="text-xs uppercase tracking-[0.12em] text-stone">
              <tr className="border-b border-line">
                <th className="py-2 text-left font-medium">Conversion</th>
                {lines.map((l) => (
                  <th key={l.plan.id} className="py-2 font-medium">
                    {l.plan.id === "custom" ? "Custom" : `Plan ${l.plan.id}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines[0].points
                .map((pt, i) => ({ pt, i }))
                .filter(({ i }) => i % 4 === 0)
                .map(({ pt, i }) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="py-1.5 text-left">{pctOf(pt.conversion)}</td>
                    {lines.map((l) => (
                      <td key={l.plan.id} className={cn("py-1.5", l.points[i].net < 0 && "text-rose")}>
                        {usd(l.points[i].net, { sign: true })}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`Hotel net per year against conversion for ${lines.length} plans. You are at ${pctOf(current)} conversion, netting ${usd(hotel.hotelNet, { sign: true })} on the selected plan.`}
            onPointerMove={(e) => {
              const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              const c = ((e.clientX - box.left - pad.l) / iw) * maxConv;
              setHover(c < 0 || c > maxConv ? null : c);
            }}
            onPointerLeave={() => setHover(null)}
            className="block touch-pan-y"
          >
            {yTicks.map((v) => (
              <g key={v}>
                <line
                  x1={pad.l}
                  x2={pad.l + iw}
                  y1={y(v)}
                  y2={y(v)}
                  stroke={v === 0 ? "var(--color-stone)" : "var(--color-line)"}
                  strokeWidth={v === 0 ? 1.25 : 1}
                />
                <text x={pad.l - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--color-stone)">
                  {usd(v, { compact: true, sign: v > 0 })}
                </text>
              </g>
            ))}
            {xTicks.map((c) => (
              <text
                key={c}
                x={x(c)}
                y={height - pad.b + 18}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-stone)"
              >
                {(c * 100).toFixed(c * 100 % 1 === 0 ? 0 : 1)}%
              </text>
            ))}
            <line
              x1={x(Math.min(current, maxConv))}
              x2={x(Math.min(current, maxConv))}
              y1={pad.t}
              y2={pad.t + ih}
              stroke="var(--color-ink)"
              strokeOpacity="0.35"
              strokeDasharray="3 3"
            />
            <text x={x(Math.min(current, maxConv)) + 6} y={pad.t + 10} fontSize="11" fill="var(--color-stone)">
              you · {pctOf(current)}
            </text>

            {lines.map((l) => (
              <path
                key={l.plan.id}
                d={l.points.map((pt, i) => `${i ? "L" : "M"}${x(pt.conversion).toFixed(1)},${y(pt.net).toFixed(1)}`).join("")}
                fill="none"
                stroke={l.style.color}
                strokeWidth={l.plan.id === plan.id ? 2.5 : 2}
                strokeDasharray={l.style.dash}
                strokeLinejoin="round"
              />
            ))}

            {lines.map((l) => {
              const be = computeHotel(inputs, l.plan).breakEven;
              if (!be || be.conversionOfReachable > maxConv) return null;
              return (
                <circle
                  key={`be-${l.plan.id}`}
                  cx={x(be.conversionOfReachable)}
                  cy={y(0)}
                  r={4.5}
                  fill={l.style.color}
                  stroke="var(--color-paper)"
                  strokeWidth="2"
                />
              );
            })}

            {labels.map((lab) => (
              <text key={lab.id} x={pad.l + iw + 8} y={lab.y} dy="0.32em" fontSize="11" fontWeight="600" fill="var(--color-ink)">
                <tspan fill={lab.color}>■</tspan> {lab.id === "custom" ? "Custom" : lab.id}
              </text>
            ))}

            {hoverIdx !== null ? (
              <g pointerEvents="none">
                <line
                  x1={x(lines[0].points[hoverIdx].conversion)}
                  x2={x(lines[0].points[hoverIdx].conversion)}
                  y1={pad.t}
                  y2={pad.t + ih}
                  stroke="var(--color-ink)"
                  strokeOpacity="0.5"
                />
                {lines.map((l) => (
                  <circle
                    key={l.plan.id}
                    cx={x(l.points[hoverIdx].conversion)}
                    cy={y(l.points[hoverIdx].net)}
                    r={4}
                    fill={l.style.color}
                    stroke="var(--color-paper)"
                    strokeWidth="2"
                  />
                ))}
              </g>
            ) : null}
            <text x={pad.l} y={height - 4} fontSize="11" fill="var(--color-stone)">
              Conversion of reachable bookings
            </text>
          </svg>

          {hoverIdx !== null ? (
            <div
              className="pointer-events-none absolute top-4 z-10 rounded-md bg-paper px-3 py-2 text-xs shadow-[var(--shadow-lift)]"
              style={{
                left: Math.min(
                  Math.max(0, x(lines[0].points[hoverIdx].conversion) + 12),
                  Math.max(0, width - 170),
                ),
              }}
            >
              <p className="mb-1 font-medium text-ink">
                {pctOf(lines[0].points[hoverIdx].conversion)} conversion
              </p>
              {lines.map((l) => (
                <p key={l.plan.id} className="flex items-center justify-between gap-4 text-stone">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full" style={{ background: l.style.color }} />
                    {l.plan.id === "custom" ? "Custom" : `Plan ${l.plan.id}`}
                  </span>
                  <span className="tabular-nums text-ink">{usd(l.points[hoverIdx].net, { sign: true })}</span>
                </p>
              ))}
            </div>
          ) : null}
        </div>
      )}
      </div>
      <p className="mt-3 text-xs text-stone">Dots mark each plan’s break-even conversion.</p>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Operator view                                                               */
/* -------------------------------------------------------------------------- */

function OperatorView({
  hotel,
  plan,
  rooms,
  operator,
  setOperator,
}: {
  hotel: HotelResult;
  plan: Plan;
  rooms: number;
  operator: OperatorInputs;
  setOperator: (patch: Partial<OperatorInputs>) => void;
}) {
  const op = computeOperator(hotel, operator);
  const rate = messageRate(operator);
  const markets = Object.keys(MESSAGE_RATES) as MarketId[];

  const warnings: string[] = [];
  if (op.grossMargin < 0.7) warnings.push("Gross margin under 70% — messaging or support is eating the fee.");
  if (op.cacPaybackMonths === null || op.cacPaybackMonths > 12)
    warnings.push("CAC payback over 12 months — self-serve and partner channels only.");
  if (op.ltvToCac < 3) warnings.push("LTV:CAC under 3 — this hotel size doesn’t fund paid acquisition.");
  if (operator.messagesPerBooking > 2)
    warnings.push("More than 2 template messages per booking breaks the lean design.");
  if (operator.category === "marketing")
    warnings.push("Marketing templates cost several times utility — and OTA terms bar unsolicited marketing.");

  return (
    <>
      <p className="max-w-3xl text-sm text-stone">
        Staylift’s side of the same hotel: {count(rooms)} rooms on{" "}
        {plan.id === "custom" ? "a custom plan" : `plan ${plan.id}`} ({planSummary(plan)}), using the
        funnel from the Hotel ROI tab. Messaging is Staylift’s cost, not the hotel’s.
      </p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
        <div className="space-y-5">
          <Panel title="Messaging" aside={`$${(rate.rate + operator.bspPerMessage).toFixed(4)} per message, all-in`}>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <label className="block" htmlFor="roi-market">
                <span className="text-sm text-ink">Market</span>
                <select
                  id="roi-market"
                  value={operator.market}
                  onChange={(e) => setOperator({ market: e.target.value as MarketId })}
                  className="mt-2 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine"
                >
                  {markets.map((m) => (
                    <option key={m} value={m}>
                      {MESSAGE_RATES[m].label}
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-xs text-stone">Recipient country sets Meta’s rate.</span>
              </label>
              <div>
                <span className="text-sm text-ink">Template category</span>
                <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Template category">
                  {(["utility", "marketing"] as const).map((c) => (
                    <Chip key={c} active={operator.category === c} onClick={() => setOperator({ category: c })}>
                      {c === "utility" ? "Utility" : "Marketing"}
                    </Chip>
                  ))}
                </div>
                <span className="mt-1.5 block text-xs text-stone">
                  Service content (check-in link, arrival details) is utility.
                </span>
              </div>
              {!rate.verified ? (
                <NumberField
                  id="roi-rate"
                  label="Rate per message"
                  unit="$"
                  help="No verified Meta rate for this market and category — enter yours."
                  value={operator.customRate}
                  min={0}
                  max={0.5}
                  step={0.001}
                  onChange={(v) => setOperator({ customRate: v })}
                />
              ) : (
                <div className="text-sm">
                  <span className="text-ink">Meta rate</span>
                  <p className="mt-2 font-display text-2xl tabular-nums">${rate.rate.toFixed(4)}</p>
                  <span className="mt-1 block text-xs text-stone">per delivered message, 2026 rate card</span>
                </div>
              )}
              <NumberField
                id="roi-bsp"
                label="Provider fee per message"
                unit="$"
                help="BSP / Twilio-style markup on top of Meta."
                value={operator.bspPerMessage}
                min={0}
                max={0.05}
                step={0.001}
                onChange={(v) => setOperator({ bspPerMessage: v })}
              />
              <NumberField
                id="roi-phone"
                label="Reached by phone"
                unit="% of reachable"
                help="The rest get email (≈ free)."
                value={operator.phoneSharePct}
                min={0}
                max={100}
                step={1}
                onChange={(v) => setOperator({ phoneSharePct: v })}
              />
              <NumberField
                id="roi-msgs"
                label="Template messages per booking"
                help="Lean design: ≤ 2 (check-in link, arrival details)."
                value={operator.messagesPerBooking}
                min={0}
                max={6}
                step={0.1}
                onChange={(v) => setOperator({ messagesPerBooking: v })}
              />
              <NumberField
                id="roi-replies"
                label="Staff replies per booking"
                help="Billed at the utility rate from 1 Oct 2026."
                value={operator.repliesPerBooking}
                min={0}
                max={5}
                step={0.1}
                onChange={(v) => setOperator({ repliesPerBooking: v })}
              />
            </div>
          </Panel>

          <Panel title="Customer economics">
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <NumberField
                id="roi-support"
                label="Support & infra per hotel"
                unit="$ / year"
                value={operator.supportPerHotelYear}
                min={0}
                max={5000}
                step={10}
                onChange={(v) => setOperator({ supportPerHotelYear: v })}
              />
              <NumberField
                id="roi-churn"
                label="Churn"
                unit="% / month"
                value={operator.churnMonthlyPct}
                min={0}
                max={20}
                step={0.1}
                onChange={(v) => setOperator({ churnMonthlyPct: v })}
              />
              <NumberField
                id="roi-cac"
                label="Blended CAC"
                unit="$"
                help="Target ≤ $750 after the first 20 hotels."
                value={operator.cac}
                min={0}
                max={20000}
                step={50}
                onChange={(v) => setOperator({ cac: v })}
              />
              <NumberField
                id="roi-hotels"
                label="Hotels like this one"
                value={operator.hotels}
                min={1}
                max={10000}
                step={1}
                onChange={(v) => setOperator({ hotels: v })}
              />
            </div>
          </Panel>
        </div>

        <aside className="rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6 lg:sticky lg:top-6" aria-live="polite">
          <p className="text-xs uppercase tracking-[0.18em] text-stone">Gross margin per hotel</p>
          <p className="mt-3 font-display text-5xl font-medium tabular-nums tracking-tight">
            {pctOf(op.grossMargin, 0)}
          </p>
          <p className="mt-2 text-sm text-stone">
            {usd(op.grossProfit)} gross profit on {usd(op.vendorRevenue)} revenue a year
          </p>
          <dl className="mt-6 space-y-2 text-sm">
            <OpLine k="Staylift revenue (fees)" v={usd(op.vendorRevenue)} />
            <OpLine
              k={`Messaging · ${count(op.templateMessages + op.replyMessages)} msgs`}
              v={`−${usd(op.messagingCost)}`}
            />
            <OpLine k="Support & infra" v={`−${usd(op.supportCost)}`} />
            <OpLine k="Messaging per booking" v={usd(op.messagingPerBooking, { cents: true })} muted />
            <div className="my-2 border-t border-line" />
            <OpLine k="LTV (gross profit)" v={usd(op.ltv)} strong />
            <OpLine
              k="CAC payback"
              v={op.cacPaybackMonths === null ? "never" : `${op.cacPaybackMonths.toFixed(1)} months`}
            />
            <OpLine k="LTV : CAC" v={`${op.ltvToCac.toFixed(1)}×`} />
            <div className="my-2 border-t border-line" />
            <OpLine k={`ARR at ${count(operator.hotels)} hotels`} v={usd(op.portfolioArr, { compact: true })} strong />
            <OpLine k="Gross profit at that scale" v={usd(op.portfolioGrossProfit, { compact: true })} />
          </dl>
          {warnings.length ? (
            <ul className="mt-5 space-y-2">
              {warnings.map((w) => (
                <li key={w} className="rounded-md bg-amber-soft px-3 py-2 text-xs text-amber">
                  {w}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-md bg-moss px-3 py-2 text-xs text-pine">
              Healthy: ≥ 70% margin, payback ≤ 12 months, LTV:CAC ≥ 3.
            </p>
          )}
          {!op.rateVerified ? (
            <p className="mt-3 text-xs text-stone">Uses your custom rate — no verified Meta figure for this combination.</p>
          ) : null}
        </aside>
      </div>

      <MarketTable hotel={hotel} operator={operator} />
    </>
  );
}

function OpLine({ k, v, strong, muted }: { k: string; v: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={cn(muted ? "text-mist" : "text-stone")}>{k}</dt>
      <dd className={cn("tabular-nums text-ink", strong && "font-medium", muted && "text-stone")}>{v}</dd>
    </div>
  );
}

function MarketTable({ hotel, operator }: { hotel: HotelResult; operator: OperatorInputs }) {
  const markets = Object.keys(MESSAGE_RATES) as MarketId[];
  return (
    <Panel title="Messaging cost by market" aside="Per hotel per year, at your message volume">
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[520px] text-right text-sm tabular-nums">
          <thead className="text-xs uppercase tracking-[0.12em] text-stone">
            <tr className="border-b border-line">
              <th className="py-2 text-left font-medium">Market</th>
              <th className="py-2 font-medium">Utility rate</th>
              <th className="py-2 font-medium">Marketing rate</th>
              <th className="py-2 font-medium">Lean (utility)</th>
              <th className="py-2 font-medium">Gross margin</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => {
              const r = MESSAGE_RATES[m];
              const op = r.utility === null ? null : computeOperator(hotel, { ...operator, market: m, category: "utility" });
              return (
                <tr key={m} className={cn("border-b border-line last:border-0", m === operator.market && "bg-moss/60")}>
                  <td className="py-2.5 text-left">{r.label}</td>
                  <td className="py-2.5">{r.utility === null ? "not verified" : `$${r.utility.toFixed(4)}`}</td>
                  <td className="py-2.5">{r.marketing === null ? "not verified" : `$${r.marketing.toFixed(4)}`}</td>
                  <td className="py-2.5">{op ? usd(op.messagingCost) : "—"}</td>
                  <td className="py-2.5">{op ? pctOf(op.grossMargin, 0) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone">
        Meta per-message rates as published for 2026; Meta revises rate cards quarterly, so re-check
        before quoting. Provider fee: ${(operator.bspPerMessage || DEFAULT_OPERATOR.bspPerMessage).toFixed(3)} per
        message.
      </p>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Method                                                                      */
/* -------------------------------------------------------------------------- */

function Method() {
  return (
    <details className="group rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
      <summary className="cursor-pointer list-none font-display text-xl font-medium">
        How this is calculated
        <span className="ml-2 text-sm font-normal text-stone group-open:hidden">show</span>
      </summary>
      <div className="mt-4 grid gap-6 text-sm text-stone md:grid-cols-2">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Bookings = rooms × occupancy × 365 ÷ average stay. The booking is the unit, not the room-night.</li>
          <li>Buyers = bookings × reachable × open the page × buy.</li>
          <li>Upsell revenue = buyers × spend per buying booking.</li>
          <li>
            Incremental revenue = upsell revenue × incrementality. The rest would have been sold at the
            desk or on the phone anyway. In a pilot this comes from a holdout group, not a guess.
          </li>
          <li>Hotel net = incremental revenue × contribution margin − Staylift fees − card processing.</li>
          <li>ROI = hotel net ÷ (fees + card processing). Return per $1 = incremental margin ÷ the same costs.</li>
        </ol>
        <ul className="space-y-2">
          <li>
            <span className="text-ink">Deliberately conservative:</span> the revenue share and card fees
            are charged on all page revenue, including the part that isn’t incremental.
          </li>
          <li>
            <span className="text-ink">Not a benchmark:</span> scenario rates are planning assumptions.
            Vendor case studies (10×, 41× ROI) are not used anywhere.
          </li>
          <li>
            <span className="text-ink">Guarantee:</span> if holdout-measured incremental revenue is under
            2× the fees after 90 days, the fees are waived.
          </li>
          <li>
            <span className="text-ink">Messaging rates:</span>{" "}
            <a className="underline" href="https://setsmart.io/blog/whatsapp-business-api-pricing" target="_blank" rel="noreferrer">US</a>,{" "}
            <a className="underline" href="https://boosend.ai/blog/whatsapp-business-api-pricing-2026" target="_blank" rel="noreferrer">UK</a>,{" "}
            <a className="underline" href="https://zernio.com/blog/whatsapp-business-api-pricing" target="_blank" rel="noreferrer">DE / NL ranges</a>,{" "}
            <a className="underline" href="https://support.zendesk.com/hc/en-us/articles/11113277351322-Announcing-upcoming-changes-to-WhatsApp-Business-messaging-pricing" target="_blank" rel="noreferrer">1 Oct 2026 change</a>.
          </li>
        </ul>
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-xl font-medium">{title}</h3>
        {aside ? <span className="text-sm text-stone">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "h-9 rounded-md px-3 text-sm font-medium transition-colors sm:px-4",
        active ? "bg-paper text-ink shadow-[var(--shadow-border)]" : "text-stone hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-4 text-sm transition-colors",
        active ? "bg-pine text-pine-fg" : "bg-cream text-ink shadow-[var(--shadow-border)] hover:bg-paper",
      )}
    >
      {children}
    </button>
  );
}

function decimalsFor(step: number) {
  return step < 1 ? String(step).split(".")[1]?.length ?? 2 : 0;
}

function NumberField({
  id,
  label,
  unit,
  help,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  unit?: string;
  help?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const decimals = decimalsFor(step);
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (raw: string) => {
    const n = Number(raw);
    setDraft(null);
    if (raw.trim() === "" || !Number.isFinite(n)) return;
    onChange(Number(Math.min(max, Math.max(min, n)).toFixed(decimals)));
  };
  // Long-tail inputs (rooms up to 400) get a slider that tops out at a sensible range.
  const sliderMax = id === "roi-rooms" ? Math.max(200, value) : max;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm text-ink">
          {label}
          {unit ? <span className="ml-1 text-xs text-stone">{unit}</span> : null}
        </label>
        <input
          id={id}
          inputMode="decimal"
          value={draft ?? String(Number(value.toFixed(decimals)))}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
          }}
          className="h-9 w-24 rounded-sm border border-line bg-cream px-2 text-right text-sm tabular-nums outline-none focus:border-pine"
        />
      </div>
      <input
        type="range"
        aria-label={`${label} slider`}
        min={min}
        max={sliderMax}
        step={step}
        value={Math.min(value, sliderMax)}
        onChange={(e) => onChange(Number(Number(e.target.value).toFixed(decimals)))}
        className="mt-1 h-8 w-full accent-pine"
      />
      {help ? <p className="text-xs leading-snug text-stone">{help}</p> : null}
    </div>
  );
}

function CopyLink() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setState("copied");
        } catch {
          setState("failed");
        }
        setTimeout(() => setState("idle"), 2200);
      }}
      className="h-9 rounded-sm bg-paper px-3 text-sm text-ink shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]"
    >
      {state === "copied" ? "Link copied" : state === "failed" ? "Copy from the address bar" : "Copy share link"}
    </button>
  );
}
