import { useState, useRef } from "react";
import { useConfirm } from "~/components/ui/confirm-dialog";
import { useNavigate } from "@remix-run/react";
import { Users, Plus, Edit2, Check, X, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { WorkflowStatusBadge } from "./workflow-status-badge";
import { InviteDialog } from "../invite/invite-dialog";
import { FileGrid } from "~/modules/file-review/src/components/file-grid/file-grid";
import { useProjectFiles } from "~/modules/file-review/src/hooks/use-project-files";
import { useFileUpload } from "~/modules/file-review/src/hooks/use-file-upload";
import { apiRequest } from "~/lib/api.client";
import { cn } from "~/lib/utils";
import {
  ProjectStatus,
  STATUS_LABEL,
} from "../../types/project-status.types";
import { getReviewWorkflowCapabilities } from "../../types/workflow-capabilities.types";
import { UserRole } from "~/modules/authentication/authentication.types";

interface ProjectDetailProps {
  project: any;
  isAgency: boolean;
  currentUserId?: string;
  onRefetch?: () => void;
}

const ACTION_ICON: Partial<Record<ProjectStatus, React.ReactNode>> = {
  [ProjectStatus.InReview]:   <Send className="h-4 w-4" />,
  [ProjectStatus.InRevision]: <AlertCircle className="h-4 w-4" />,
  [ProjectStatus.Approved]:   <CheckCircle2 className="h-4 w-4" />,
};

const ACTION_VARIANT: Partial<Record<ProjectStatus, string>> = {
  [ProjectStatus.InReview]:   "bg-blue-600 hover:bg-blue-700 text-white",
  [ProjectStatus.InRevision]: "bg-orange-500 hover:bg-orange-600 text-white",
  [ProjectStatus.Approved]:   "bg-green-600 hover:bg-green-700 text-white",
};

export function ProjectDetail({ project, isAgency, currentUserId, onRefetch }: ProjectDetailProps) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { files, loading: filesLoading, refetch: refetchFiles } = useProjectFiles(project?._id ?? "", { basePath: "/api/review-workflow" });
  const { addRevision } = useFileUpload(project?._id ?? "", { metadataBasePath: "/api/review-workflow" });
  const revisionInputRef = useRef<HTMLInputElement>(null);
  const revisionTargetId = useRef<string | null>(null);

  const [showInvite, setShowInvite] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(project?.description ?? "");
  const [transitioning, setTransitioning] = useState(false);

  if (!project) return null;

  const projectStatus = project.status as ProjectStatus;
  const role = isAgency ? UserRole.Agency : UserRole.Client;
  const capabilities = getReviewWorkflowCapabilities(projectStatus, role);
  const transitions = capabilities.transitions;
  const showFiles = capabilities.canViewFiles;

  async function handleDeleteFile(fileId: string) {
    const ok = await confirm({ title: "Delete file", message: "This will permanently delete all revisions of this file.", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    await apiRequest(`/api/review-workflow/files/${fileId}`, { method: "DELETE" });
    refetchFiles();
  }

  function handleUploadRevision(fileId: string) {
    revisionTargetId.current = fileId;
    revisionInputRef.current?.click();
  }

  async function handleRevisionInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !revisionTargetId.current) return;
    await addRevision(revisionTargetId.current, file);
    refetchFiles();
    if (revisionInputRef.current) revisionInputRef.current.value = "";
    revisionTargetId.current = null;
  }

  async function handleRemoveClient(userId: string) {
    setRemovingId(userId);
    await apiRequest(`/api/review-workflow/projects/${project._id}/clients/${userId}`, { method: "DELETE" });
    onRefetch?.();
    setRemovingId(null);
  }

  async function handleSaveDesc() {
    await apiRequest(`/api/review-workflow/projects/${project._id}`, { method: "PATCH", data: { description: descValue } });
    setEditingDesc(false);
    onRefetch?.();
  }

  async function handleTransition(toStatus: ProjectStatus) {
    const label = STATUS_LABEL[toStatus] ?? toStatus;
    const ok = await confirm({ message: `Move project to "${label}"?`, confirmLabel: label });
    if (!ok) return;
    setTransitioning(true);
    await apiRequest(`/api/review-workflow/projects/${project._id}/status`, { method: "PATCH", data: { status: toStatus } });
    setTransitioning(false);
    onRefetch?.();
  }

  return (
    <div className="space-y-8">
      {/* Hidden revision upload input */}
      <input ref={revisionInputRef} type="file" className="hidden" onChange={handleRevisionInputChange}
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.mov,.docx,.xlsx,.pptx" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{project.title}</h1>

          {editingDesc ? (
            <div className="mt-2 flex gap-2">
              <textarea
                autoFocus
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                rows={3}
                className="flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Project description / note for the client…"
              />
              <div className="flex flex-col gap-1">
                <button onClick={handleSaveDesc} className="rounded-md bg-primary p-1.5 text-primary-foreground hover:opacity-90">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => { setEditingDesc(false); setDescValue(project.description ?? ""); }} className="rounded-md border p-1.5 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-start gap-2">
              <p className="text-sm text-muted-foreground flex-1">
                {project.description || (isAgency ? <span className="italic">No description yet.</span> : null)}
              </p>
              {isAgency && (
                <button onClick={() => setEditingDesc(true)} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        <WorkflowStatusBadge status={project.status} round={project.round} />
      </div>

      {/* Workflow action bar */}
      {transitions.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <span className="text-sm text-muted-foreground shrink-0">Next:</span>
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <button
                key={t.to}
                onClick={() => handleTransition(t.to)}
                disabled={transitioning}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
                  ACTION_VARIANT[t.to] ?? "bg-primary hover:opacity-90 text-primary-foreground"
                )}
              >
                {ACTION_ICON[t.to]}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clients section (agency only) */}
      {capabilities.canManageClients && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Clients</h2>
            <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 text-sm text-primary">
              <Plus className="h-4 w-4" /> Add client
            </button>
          </div>

          {!project.client_ids || project.client_ids.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No clients added yet.</p>
              <button onClick={() => setShowInvite(true)} className="mt-3 text-sm font-medium text-primary hover:underline">
                Add a client
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.client_ids.map((client: any) => {
                const id = client._id ?? client;
                const name = client.profile?.display_name ?? client.username ?? id;
                const email = client.email;
                return (
                  <div key={id} className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
                    <div>
                      <span className="text-sm font-medium">{name}</span>
                      {email && <span className="ml-1 text-xs text-muted-foreground">({email})</span>}
                    </div>
                    <button onClick={() => handleRemoveClient(id)} disabled={removingId === id} className="text-muted-foreground hover:text-destructive disabled:opacity-40">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Files section */}
      {showFiles ? (
        <div>
          <h2 className="mb-4 font-semibold">Files</h2>
          {projectStatus === ProjectStatus.InRevision && capabilities.canUpload && (
            <p className="mb-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 px-4 py-2.5 text-sm text-orange-700 dark:text-orange-400">
              Client requested revisions. Upload updated files and click "Submit for Review" when ready.
            </p>
          )}
          {projectStatus === ProjectStatus.Approved && (
            <p className="mb-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">
              This project has been approved.
            </p>
          )}
          <FileGrid
            projectId={project._id}
            files={files}
            loading={filesLoading}
            canUpload={capabilities.canUpload}
            canAddRevision={capabilities.canAddRevision}
            canDeleteFile={capabilities.canDeleteFile}
            activeFileId={null}
            onFileSelect={(file) => navigate(`/projects/${project._id}/files/${file._id}`)}
            onFilesUploaded={refetchFiles}
            onUploadRevision={handleUploadRevision}
            onDeleteFile={handleDeleteFile}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {projectStatus === ProjectStatus.Draft
              ? "The agency is still preparing this project."
              : "Files are not available at this stage."}
          </p>
        </div>
      )}

      {/* Modals */}
      {showInvite && (
        <InviteDialog
          projectId={project._id}
          currentClientIds={(project.client_ids ?? []).map((c: any) => c._id ?? c)}
          onClose={() => setShowInvite(false)}
          onClientAdded={onRefetch}
        />
      )}

    </div>
  );
}
