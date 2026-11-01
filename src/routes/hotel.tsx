import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { HotelShell } from "@/components/hotel-shell";
import { getHotelContext } from "@/lib/staylift/server";
import { isUnauthorized, toLogin } from "@/lib/staylift/session";

export const Route = createFileRoute("/hotel")({
  loader: async ({ location }) => {
    try {
      const ctx = await getHotelContext();
      if (ctx.kind === "onboarding") throw redirect({ to: "/onboarding" });
      return ctx;
    } catch (err) {
      if (isUnauthorized(err)) throw toLogin(location.href);
      throw err;
    }
  },
  component: HotelLayout,
});

function HotelLayout() {
  const ctx = Route.useLoaderData();
  if (ctx.kind !== "ok") return null;
  return (
    <HotelShell ctx={ctx}>
      <Outlet />
    </HotelShell>
  );
}
