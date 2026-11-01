import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, money } from "@/lib/staylift/format";
import type { Order } from "@/lib/staylift/types";

export function PendingCard({
  order,
  onDecide,
  large,
}: {
  order: Order;
  onDecide: (id: string, decision: "approve" | "decline") => void;
  large?: boolean;
}) {
  const locked = order.approvableFrom !== null;
  return (
    <li className="rounded-lg bg-paper p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={large ? "font-display text-2xl font-medium" : "font-medium"}>{order.guestName}</p>
          <p className="text-sm text-stone">
            {order.channel === "desk" ? <Badge tone="quiet" className="mr-1.5">Desk</Badge> : null}
            {order.offerName}
            {order.forTime ? ` · ${order.forTime}` : ""}
            {order.forDate ? ` · ${formatDate(order.forDate)}` : ""}
          </p>
        </div>
        <p className={large ? "font-display text-2xl tabular-nums" : "tabular-nums text-sm"}>
          {money(order.amountCents)}
        </p>
      </div>
      {locked ? (
        <p className="mt-2 text-xs text-amber">
          Upgrades are confirmed from {formatDate(order.approvableFrom!)} — 72 hours before arrival —
          so they never displace a higher-paying booking.
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={locked} onClick={() => onDecide(order.id, "approve")}>
          <Check className="size-4" />
          Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDecide(order.id, "decline")}>
          <X className="size-4" />
          Decline
        </Button>
        {large ? (
          <Link to="/stay/$token" params={{ token: order.token }}>
            <Button size="sm" variant="ghost">
              Guest page
            </Button>
          </Link>
        ) : null}
      </div>
    </li>
  );
}

