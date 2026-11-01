import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Copy, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/staylift/format";
import { ROLE_HINT, ROLE_LABEL, ROLES, type Role } from "@/lib/staylift/roles";
import { changeMemberRole, getTeam, inviteMember, removeTeamMember, revokeInvite } from "@/lib/staylift/server";

export const Route = createFileRoute("/hotel/team")({
  loader: () => getTeam(),
  component: TeamPage,
});

function TeamPage() {
  const team = Route.useLoaderData();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("front_desk");
  const [busy, setBusy] = useState(false);
  const [lastLink, setLastLink] = useState<{ link: string; email: string; emailed: boolean } | null>(null);

  async function act<T>(fn: () => Promise<T>, ok?: string) {
    setBusy(true);
    try {
      const r = await fn();
      if (ok) toast.success(ok);
      await router.invalidate();
      return r;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not do that.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const r = await act(() => inviteMember({ data: { email, role, origin: window.location.origin } }));
    if (r) {
      setLastLink(r);
      setEmail("");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Team</h1>
      <p className="mt-2 max-w-2xl text-stone">Everyone signs in with their own account. Roles decide what each person can see and do.</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <li key={r} className="rounded-lg bg-cream px-4 py-3">
            <p className="text-sm font-medium">{ROLE_LABEL[r]}</p>
            <p className="mt-1 text-xs text-stone">{ROLE_HINT[r]}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={(e) => void invite(e)} className="mt-6 flex flex-col gap-2 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm text-stone">
          Invite by email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine"
          />
        </label>
        <label className="block text-sm text-stone">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm sm:w-40">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={busy}>
          <UserPlus className="size-4" /> Invite
        </Button>
      </form>

      {lastLink ? (
        <div className="mt-3 rounded-xl bg-moss p-4 text-sm text-pine">
          <p>
            {lastLink.emailed ? `Invitation emailed to ${lastLink.email}. ` : `Email isn't set up, so send ${lastLink.email} this link yourself. `}
            It works once, for 7 days.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-paper px-2 py-1 font-mono text-xs text-ink">{lastLink.link}</code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void navigator.clipboard.writeText(lastLink.link).then(() => toast.success("Copied."))}
            >
              <Copy className="size-4" /> Copy
            </Button>
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-[0.16em] text-stone">Members ({team.members.length})</h2>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-border)]">
          {team.members.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {m.name || m.email} {m.userId === team.me ? <Badge className="ml-1">You</Badge> : null}
                </p>
                <p className="text-xs text-stone">
                  {m.email} · joined {formatDate(m.joinedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label={`Role for ${m.email}`}
                  value={m.role}
                  disabled={busy}
                  onChange={(e) => void act(() => changeMemberRole({ data: { userId: m.userId, role: e.target.value as Role } }), "Role changed.")}
                  className="h-9 rounded-md border border-line bg-cream px-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                {m.userId !== team.me ? (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act(() => removeTeamMember({ data: { userId: m.userId } }), "Removed.")}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {team.invitations.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.16em] text-stone">Pending invitations</h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-border)]">
            {team.invitations.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>
                  {i.email} · {ROLE_LABEL[i.role]} <span className="text-stone">· expires {formatDate(i.expiresAt)}</span>
                </span>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act(() => revokeInvite({ data: { invitationId: i.id } }), "Revoked.")}>
                  <X className="size-4" /> Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
