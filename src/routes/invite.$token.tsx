import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ROLE_HINT, ROLE_LABEL, type Role } from "@/lib/staylift/roles";
import { acceptInvite, getInvitation } from "@/lib/staylift/server";

export const Route = createFileRoute("/invite/$token")({
  loader: ({ params }) => getInvitation({ data: { token: params.token } }),
  component: Invite,
});

function Invite() {
  const invite = Route.useLoaderData();
  const { token } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      await acceptInvite({ data: { token } });
      toast.success(`You're on the ${invite?.propertyName} team.`);
      await router.navigate({ to: "/hotel" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept.");
    } finally {
      setBusy(false);
    }
  }

  const here = `/invite/${token}`;
  return (
    <main className="grid min-h-dvh place-items-center bg-linen px-4 py-10">
      <div className="w-full max-w-md">
        <Mark />
        {!invite || !invite.usable ? (
          <>
            <h1 className="mt-8 font-display text-3xl font-medium">This invitation has expired</h1>
            <p className="mt-2 text-stone">Ask the hotel's owner to send a new one. Invitations last 7 days and work once.</p>
          </>
        ) : (
          <div className="mt-8 rounded-xl bg-paper p-6 shadow-[var(--shadow-border)]">
            <p className="text-xs uppercase tracking-[0.16em] text-stone">Invitation</p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Join {invite.propertyName}</h1>
            <p className="mt-2 text-stone">
              As <strong className="text-ink">{ROLE_LABEL[invite.role as Role]}</strong>: {ROLE_HINT[invite.role as Role]}
            </p>
            <p className="mt-4 text-sm text-stone">For {invite.email}</p>
            {isPending ? null : user ? (
              user.primaryEmail?.toLowerCase() === invite.email ? (
                <Button className="mt-5 w-full" onClick={() => void accept()} disabled={busy}>
                  {busy ? "Joining…" : "Accept and open the hotel"}
                </Button>
              ) : (
                <div className="mt-5 rounded-md bg-amber-soft p-3 text-sm text-amber">
                  You're signed in as {user.primaryEmail}.{" "}
                  <button type="button" className="underline" onClick={() => void signOut(`/login?mode=signup&next=${encodeURIComponent(here)}`)}>
                    Switch account
                  </button>
                </div>
              )
            ) : (
              <div className="mt-5 grid gap-2">
                <Link to="/login" search={{ next: here, mode: "signup" }}>
                  <Button className="w-full">Create account with {invite.email}</Button>
                </Link>
                <Link to="/login" search={{ next: here }}>
                  <Button variant="ghost" className="w-full">I already have an account</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
