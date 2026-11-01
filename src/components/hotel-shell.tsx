import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  BedDouble,
  CalendarRange,
  ChartNoAxesColumn,
  ClipboardList,
  LayoutGrid,
  LogOut,
  ScrollText,
  Settings,
  Sparkles,
  Tablet,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Mark } from "@/components/mark";
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
  | "/hotel/team"
  | "/hotel/settings"
  | "/hotel/audit";

const NAV: { to: NavTo; label: string; short: string; icon: typeof LayoutGrid; cap: Capability; exact?: boolean; group: "work" | "admin" }[] = [
  { to: "/hotel", label: "Overview", short: "Overview", icon: LayoutGrid, cap: "viewOverview", exact: true, group: "work" },
  { to: "/hotel/reservations", label: "Reservations", short: "Book", icon: CalendarRange, cap: "workReservations", group: "work" },
  { to: "/hotel/guests", label: "Guests", short: "Guests", icon: UsersRound, cap: "viewGuests", group: "work" },
  { to: "/hotel/fulfillment", label: "Fulfillment", short: "Orders", icon: ClipboardList, cap: "workOrders", group: "work" },
  { to: "/hotel/offers", label: "Offers", short: "Offers", icon: BedDouble, cap: "workOrders", group: "work" },
  { to: "/hotel/automation", label: "Recipes", short: "Recipes", icon: Sparkles, cap: "editRecipes", group: "work" },
  { to: "/hotel/analytics", label: "Attribution", short: "Funnel", icon: ChartNoAxesColumn, cap: "viewAnalytics", group: "work" },
  { to: "/hotel/roi", label: "Measured ROI", short: "ROI", icon: TrendingUp, cap: "viewRoi", group: "work" },
  { to: "/hotel/team", label: "Team", short: "Team", icon: Users, cap: "manageTeam", group: "admin" },
  { to: "/hotel/settings", label: "Settings & privacy", short: "Settings", icon: Settings, cap: "editSettings", group: "admin" },
  { to: "/hotel/audit", label: "Audit log", short: "Audit", icon: ScrollText, cap: "viewAudit", group: "admin" },
];

/** Phone bottom bar: the daily screens. The rest sit in the header menu. */
const MOBILE_NAV: NavTo[] = ["/hotel", "/hotel/reservations", "/hotel/guests", "/hotel/fulfillment", "/hotel/roi"];

export function HotelShell({ children, ctx }: { children: React.ReactNode; ctx: Ctx }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const items = NAV.filter((i) => ctx.caps[i.cap]);
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

  const hotelBlock = (
    <div className="px-2">
      {ctx.memberships.length > 1 ? (
        <select
          aria-label="Hotel"
          value={ctx.propertyId}
          onChange={(e) => void changeHotel(e.target.value)}
          className="w-full cursor-pointer truncate rounded-md bg-transparent font-display text-lg leading-tight text-ink outline-none"
        >
          {ctx.memberships.map((m) => (
            <option key={m.propertyId} value={m.propertyId}>
              {m.propertyName}
            </option>
          ))}
        </select>
      ) : (
        <p className="font-display text-lg leading-tight text-ink">{ctx.propertyName}</p>
      )}
      <p className="text-xs text-stone">
        {ctx.city} · {ctx.rooms} rooms{ctx.isDemo ? " · demo" : ""}
      </p>
    </div>
  );

  const userBlock = (
    <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm text-ink">{ctx.userName || ctx.email}</p>
        <p className="text-xs text-stone">{ROLE_LABEL[ctx.role]}</p>
      </div>
      <button
        type="button"
        aria-label="Sign out"
        title="Sign out"
        onClick={() => void signOut("/login").catch(() => toast.error("Sign-out didn't go through. Try again."))}
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-stone hover:bg-paper hover:text-ink"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-linen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col overflow-y-auto border-r border-line bg-cream/80 px-4 py-6 lg:flex">
        <Link to="/" className="px-2">
          <Mark />
        </Link>
        <div className="mt-6">{hotelBlock}</div>
        <nav className="mt-6 flex flex-col gap-1">
          {items.map((item, i) => {
            const Icon = item.icon;
            const active = isActive(item);
            const firstAdmin = item.group === "admin" && items[i - 1]?.group !== "admin";
            return (
              <div key={item.to}>
                {firstAdmin ? <p className="mb-1 mt-4 px-3 text-[11px] uppercase tracking-[0.14em] text-mist">Admin</p> : null}
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-10 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150",
                    active ? "bg-pine text-pine-fg" : "text-stone hover:bg-paper hover:text-ink",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  <span className="flex-1">{item.label}</span>
                  {item.to === "/hotel/fulfillment" && ctx.pendingCount > 0 ? (
                    <span
                      className={cn(
                        "min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums",
                        active ? "bg-pine-fg/15 text-pine-fg" : "bg-amber-soft text-amber",
                      )}
                    >
                      {ctx.pendingCount}
                    </span>
                  ) : null}
                </Link>
              </div>
            );
          })}
        </nav>
        {ctx.caps.runDeskTablet ? (
          <Link
            to="/desk"
            className="mt-4 flex h-10 items-center gap-2.5 rounded-md border border-line px-3 text-sm text-ink hover:bg-paper"
          >
            <Tablet className="size-4" strokeWidth={1.75} />
            Check-in tablet
          </Link>
        ) : null}
        <div className="mt-auto space-y-1 pt-6">
          <Link to="/roi" className="block rounded-md px-3 py-1.5 text-xs text-stone hover:text-ink">
            ROI calculator →
          </Link>
          {userBlock}
        </div>
      </aside>

      <div className="lg:pl-56">
        <header className="sticky top-0 z-10 border-b border-line bg-linen/90 px-4 py-3 backdrop-blur-sm lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link to="/">
              <Mark />
            </Link>
            <button
              type="button"
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
              className="h-9 rounded-md px-3 text-sm text-stone hover:bg-cream hover:text-ink"
            >
              {menu ? "Close" : "Menu"}
            </button>
          </div>
          {menu ? (
            <div className="mt-3 space-y-3 border-t border-line pt-3">
              {hotelBlock}
              <nav className="grid grid-cols-2 gap-1">
                {items
                  .filter((i) => !MOBILE_NAV.includes(i.to))
                  .map((item) => (
                    <Link key={item.to} to={item.to} onClick={() => setMenu(false)} className="rounded-md px-3 py-2 text-sm text-stone hover:bg-cream hover:text-ink">
                      {item.label}
                    </Link>
                  ))}
                {ctx.caps.runDeskTablet ? (
                  <Link to="/desk" className="rounded-md px-3 py-2 text-sm text-stone hover:bg-cream hover:text-ink">
                    Check-in tablet
                  </Link>
                ) : null}
              </nav>
              {userBlock}
            </div>
          ) : null}
        </header>
        <main className="px-4 py-6 pb-24 sm:px-8 sm:py-8 lg:pb-10">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-cream/95 backdrop-blur-sm lg:hidden"
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
