import { cn } from "~/lib/utils";
import { ProjectStatus, STATUS_LABEL, STATUS_COLOR } from "../../types/project-status.types";

export function WorkflowStatusBadge({ status, round }: { status: string; round?: number }) {
  const s = status as ProjectStatus;
  const label = STATUS_LABEL[s] ?? status;
  const color = STATUS_COLOR[s] ?? "bg-gray-100 text-gray-600";
  const showRound = round && round > 1 && [
    ProjectStatus.InReview, ProjectStatus.InRevision, ProjectStatus.Approved,
  ].includes(s);

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap", color)}>
        {label}
      </span>
      {showRound && (
        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
          Round {round}
        </span>
      )}
    </div>
  );
}
