import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  BedDouble,
  Calculator,
  CalendarRange,
  ChartNoAxesColumn,
  ClipboardList,
  LayoutGrid,
  LogOut,
  Menu as MenuIcon,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Tablet,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Mark } from "@/components/mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";
import { ROLE_LABEL, type Capability } from "@/lib/staylift/roles";
import { switchHotel, type HotelContext } from "@/lib/staylift/server";
import { cn } from "@/lib/utils";

type Ctx = Extract<HotelContext, { kind: "ok" }>;

type NavTo =
  | "/hotel"
  | "/hotel/reservations"
  | "/hotel/guests"
  | "/hotel/offers"
  | "/hotel/fulfillment"
  | "/hotel/automation"
  | "/hotel/analytics"
  | "/hotel/roi"
  | "/hotel/compliance"
  | "/hotel/team"
  | "/hotel/settings"
  | "/hotel/audit";

const NAV: { to: NavTo; label: string; short: string; icon: typeof LayoutGrid; cap: Capability; exact?: boolean; group: "work" | "admin" }[] = [
  { to: "/hotel", label: "Overview", short: "Overview", icon: LayoutGrid, cap: "viewOverview", exact: true, group: "work" },
  { to: "/hotel/reservations", label: "Reservations", short: "Book", icon: CalendarRange, cap: "workReservations", group: "work" },
  { to: "/hotel/guests", label: "Guests", short: "Guests", icon: UsersRound, cap: "viewGuests", group: "work" },
  { to: "/hotel/fulfillment", label: "Requests", short: "Requests", icon: ClipboardList, cap: "workOrders", group: "work" },
  { to: "/hotel/offers", label: "Offers", short: "Offers", icon: BedDouble, cap: "workOrders", group: "work" },
  { to: "/hotel/automation", label: "Recipes", short: "Recipes", icon: Sparkles, cap: "editRecipes", group: "work" },
  { to: "/hotel/analytics", label: "Stats", short: "Stats", icon: ChartNoAxesColumn, cap: "viewAnalytics", group: "work" },
  { to: "/hotel/roi", label: "Measured ROI", short: "ROI", icon: TrendingUp, cap: "viewRoi", group: "work" },
  { to: "/hotel/team", label: "Team", short: "Team", icon: Users, cap: "manageTeam", group: "admin" },
  { to: "/hotel/compliance", label: "Compliance report", short: "Compliance", icon: ShieldCheck, cap: "viewAudit", group: "admin" },
  { to: "/hotel/settings", label: "Settings & privacy", short: "Settings", icon: Settings, cap: "editSettings", group: "admin" },
  { to: "/hotel/audit", label: "Audit log", short: "Audit", icon: ScrollText, cap: "viewAudit", group: "admin" },
];

/** Phone bottom bar: the daily screens. The rest sit in the header menu. */
const MOBILE_NAV: NavTo[] = ["/hotel", "/hotel/reservations", "/hotel/guests", "/hotel/fulfillment", "/hotel/roi"];

function initialsOf(name: string | null, email: string | null) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 1).toUpperCase() || "?";
}

export function HotelShell({ children, ctx }: { children: React.ReactNode; ctx: Ctx }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const items = NAV.filter((i) => ctx.caps[i.cap]);
  const workItems = items.filter((i) => i.group === "work");
  const adminItems = items.filter((i) => i.group === "admin");
  const isActive = (item: (typeof NAV)[number]) => (item.exact ? pathname === item.to : pathname.startsWith(item.to));

  async function changeHotel(propertyId: string) {
    try {
      await switchHotel({ data: { propertyId } });
      await router.navigate({ to: "/hotel" });
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch hotel.");
    }
  }

  async function handleSignOut() {
    setUserMenu(false);
    try {
      await signOut("/login");
    } catch {
      toast.error("Sign-out didn't go through. Try again.");
    }
  }

  /** The demo property ships with its own crest (src/logo/marlowe.svg). */
  const crest = ctx.propertyName === "The Marlowe" ? "/logo/marlowe.svg" : null;
  const hotelBlock = (
    <div className="flex min-w-0 items-center gap-2.5">
      {crest ? <img src={crest} alt="" className="size-9 shrink-0" /> : null}
      <div className="min-w-0">
        {ctx.memberships.length > 1 ? (
          <select
            aria-label="Hotel"
            value={ctx.propertyId}
            onChange={(e) => void changeHotel(e.target.value)}
            className="max-w-[230px] cursor-pointer truncate rounded-md bg-transparent text-[15px] font-semibold leading-tight text-ink outline-none hover:text-pine"
          >
            {ctx.memberships.map((m) => (
              <option key={m.propertyId} value={m.propertyId}>
                {m.propertyName}
              </option>
            ))}
          </select>
        ) : (
          <p className="truncate text-[15px] font-semibold leading-tight text-ink">{ctx.propertyName}</p>
        )}
        <p className="text-xs text-stone">
          {ctx.city} · {ctx.rooms} rooms{ctx.isDemo ? " · demo" : ""}
        </p>
      </div>
    </div>
  );

  const railButton = (item: (typeof NAV)[number]) => {
    const Icon = item.icon;
    const active = isActive(item);
    const badge = item.to === "/hotel/fulfillment" && ctx.pendingCount > 0;
    return (
      <Link
        key={item.to}
        to={item.to}
        title={item.label}
        aria-label={item.label}
        className={cn(
          "relative flex size-10 items-center justify-center rounded-xl transition-colors duration-150",
          active ? "bg-pine text-pine-fg" : "text-stone hover:bg-cream hover:text-ink",
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} />
        {badge ? (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
              active ? "bg-pine-fg/25 text-pine-fg" : "bg-amber-soft text-amber",
            )}
          >
            {ctx.pendingCount}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="hotel-scope min-h-dvh bg-linen">
      {/* icon rail — work surfaces; admin lives in the account menu */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[68px] flex-col items-center border-r border-line bg-paper py-4 lg:flex">
        <Link to="/" aria-label="Staylift" className="flex size-10 items-center justify-center rounded-xl hover:bg-cream">
          <Mark wordmark={false} />
        </Link>
        <nav className="mt-4 flex flex-col items-center gap-1.5" aria-label="Hotel desk">
          {workItems.map(railButton)}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-1.5">
          {ctx.caps.runDeskTablet ? (
            <Link
              to="/desk"
              title="Check-in tablet"
              aria-label="Check-in tablet"
              className="flex size-10 items-center justify-center rounded-xl text-stone hover:bg-cream hover:text-ink"
            >
              <Tablet className="size-5" strokeWidth={1.75} />
            </Link>
          ) : null}
        </div>
      </aside>

      <div className="lg:pl-[68px]">
        <header className="sticky top-0 z-30 border-b border-line bg-linen/85 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-expanded={menu}
                aria-label="Menu"
                onClick={() => setMenu((v) => !v)}
                className="flex size-9 items-center justify-center rounded-xl text-stone hover:bg-cream hover:text-ink lg:hidden"
              >
                <MenuIcon className="size-5" strokeWidth={1.75} />
              </button>
              {hotelBlock}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link to="/hotel/reservations" className="hidden sm:block">
                <Button size="sm">
                  New booking
                </Button>
              </Link>
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={userMenu}
                  aria-label="Account menu"
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex size-9 items-center justify-center rounded-full bg-pine text-xs font-semibold text-pine-fg"
                >
                  {initialsOf(ctx.userName, ctx.email)}
                </button>
                {userMenu ? (
                  <>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-hidden
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-line bg-paper p-2 shadow-[var(--shadow-lift)]">
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold text-ink">{ctx.userName || ctx.email}</p>
                        {ctx.userName && ctx.email ? <p className="truncate text-xs text-stone">{ctx.email}</p> : null}
                        <Badge tone="pine" className="mt-1.5">
                          {ROLE_LABEL[ctx.role]}
                        </Badge>
                      </div>
                      <div className="my-1 h-px bg-line" />
                      <Link
                        to="/roi"
                        onClick={() => setUserMenu(false)}
                        className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-ink hover:bg-cream"
                      >
                        <Calculator className="size-4 text-stone" /> ROI calculator
                      </Link>
                      {adminItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setUserMenu(false)}
                            className={cn(
                              "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm hover:bg-cream",
                              isActive(item) ? "font-medium text-pine" : "text-ink",
                            )}
                          >
                            <Icon className="size-4 text-stone" /> {item.label}
                          </Link>
                        );
                      })}
                      <div className="my-1 h-px bg-line" />
                      {ctx.isDemoUser ? (
                        <p className="px-3 py-2 text-xs leading-snug text-stone">
                          Demo mode — everyone shares this sample hotel.{" "}
                          <Link to="/login" className="font-medium text-pine underline-offset-4 hover:underline">
                            Sign in
                          </Link>{" "}
                          for your own workspace.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleSignOut()}
                          className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-ink hover:bg-cream"
                        >
                          <LogOut className="size-4 text-stone" /> Sign out
                        </button>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          {menu ? (
            <div className="border-t border-line px-4 pb-4 pt-3 lg:hidden">
              <nav className="grid grid-cols-2 gap-1" aria-label="All pages">
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenu(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      isActive(item) ? "bg-moss font-medium text-pine" : "text-stone hover:bg-cream hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {ctx.caps.runDeskTablet ? (
                  <Link to="/desk" onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 text-sm text-stone hover:bg-cream hover:text-ink">
                    Check-in tablet
                  </Link>
                ) : null}
                <Link to="/roi" onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 text-sm text-stone hover:bg-cream hover:text-ink">
                  ROI calculator
                </Link>
              </nav>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{ctx.userName || ctx.email}</p>
                  <p className="text-xs text-stone">{ROLE_LABEL[ctx.role]}</p>
                </div>
                {ctx.isDemoUser ? (
                  <Link
                    to="/login"
                    className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-stone hover:bg-cream hover:text-ink"
                  >
                    <LogOut className="size-4" /> Sign in
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-stone hover:bg-cream hover:text-ink"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-12">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-paper/95 backdrop-blur-sm lg:hidden"
        style={{ gridTemplateColumns: `repeat(${items.filter((i) => MOBILE_NAV.includes(i.to)).length}, minmax(0, 1fr))` }}
      >
        {items
          .filter((item) => MOBILE_NAV.includes(item.to))
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]", active ? "text-pine" : "text-stone")}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={1.75} />
                  {item.to === "/hotel/fulfillment" && ctx.pendingCount > 0 ? (
                    <span className="absolute -right-2 -top-1 size-1.5 rounded-full bg-amber" />
                  ) : null}
                </span>
                {item.short}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
