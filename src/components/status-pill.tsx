import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/staylift/format";
import type { StayStatus } from "@/lib/staylift/types";

export function StatusPill({ status }: { status: StayStatus }) {
  const tone =
    status === "in_house"
      ? "pine"
      : status === "departing"
        ? "amber"
        : status === "departed"
          ? "quiet"
          : "quiet";
  return <Badge tone={tone}>{statusLabel(status)}</Badge>;
}

export function ContactPill({
  reachable,
  channels,
}: {
  reachable: boolean;
  channels: string[];
}) {
  return (
    <Badge tone={reachable ? "pine" : "rose"}>
      {reachable ? channels[0] ?? "Reachable" : "No channel"}
    </Badge>
  );
}
