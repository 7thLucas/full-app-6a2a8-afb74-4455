import { Link } from "@remix-run/react";
import { Plus, Inbox } from "lucide-react";
import { ProjectCard } from "./project-card";

interface ProjectListProps {
  projects: any[];
  loading: boolean;
  isAgency: boolean;
}

export function ProjectList({ projects, loading, isAgency }: ProjectListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Inbox className="h-7 w-7 text-muted-foreground" />
        </div>
        {isAgency ? (
          <>
            <p className="text-muted-foreground">No projects yet.</p>
            <Link to="/projects/new" className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> Create your first project
            </Link>
          </>
        ) : (
          <>
            <p className="font-medium">No projects assigned yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              You haven't been added to any projects yet. Ask your agency for an invite link, or wait to be added.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => <ProjectCard key={p._id} project={p} />)}
    </div>
  );
}
