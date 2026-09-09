import { TOPIC_STATUS_LABELS, type TopicStatus } from "@pdi-os/domain";
import { Badge } from "@/components/ui/badge";

const VARIANT: Record<TopicStatus, "neutral" | "accent" | "success"> = {
  not_started: "neutral",
  studying: "accent",
  completed: "success",
};

export function TopicStatusBadge({ status }: { status: TopicStatus }) {
  return <Badge variant={VARIANT[status]}>{TOPIC_STATUS_LABELS[status]}</Badge>;
}
