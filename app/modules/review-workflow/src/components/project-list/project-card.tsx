import { Link } from "@remix-run/react";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { ProjectStatus, STATUS_LABEL, STATUS_COLOR } from "../../types/project-status.types";

interface ProjectCardProps {
  project: {
    _id: string;
    title: string;
    status: string;
    round?: number;
    deadline?: string;
    client_ids?: any[];
    description?: string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const s = project.status as ProjectStatus;
  const label = STATUS_LABEL[s] ?? project.status;
  const color = STATUS_COLOR[s] ?? "bg-gray-100 text-gray-600";

  return (
    <Link
      to={`/projects/${project._id}`}
      className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{project.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", color)}>
            {label}
          </span>
          {project.round && project.round > 1 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              R{project.round}
            </span>
          )}
        </div>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {project.deadline && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(project.deadline).toLocaleDateString()}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {project.client_ids?.length ?? 0} client{project.client_ids?.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center gap-1 text-xs font-medium text-primary">
        Open <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}
