import { FileText, Image, Video, File, Trash2, FilePlus2, MessageSquare } from "lucide-react";
import { cn } from "~/lib/utils";

const TYPE_ICON: Record<string, React.ElementType> = {
  pdf: FileText,
  image: Image,
  video: Video,
  office: File,
};

const TYPE_COLOR: Record<string, string> = {
  pdf: "text-red-500 bg-red-50 dark:bg-red-950/30",
  image: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  video: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  office: "text-green-500 bg-green-50 dark:bg-green-950/30",
};

interface FileCardProps {
  file: {
    _id: string;
    file_name: string;
    file_type: string;
    file_url: string;
    file_size_bytes?: number;
    revision?: number;
    createdAt: string;
    uploaded_by?: string;
    uploader?: { _id: string; username?: string; email?: string };
  };
  commentCount?: number;
  canAddRevision?: boolean;
  canDeleteFile?: boolean;
  active: boolean;
  onClick: () => void;
  onUploadRevision?: () => void;
  onDelete?: () => void;
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileCard({ file, commentCount, canAddRevision = false, canDeleteFile = false, active, onClick, onUploadRevision, onDelete }: FileCardProps) {
  const Icon = TYPE_ICON[file.file_type] ?? File;
  const colorClass = TYPE_COLOR[file.file_type] ?? "text-gray-500 bg-gray-50";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 cursor-pointer transition-all hover:shadow-md",
        active && "border-primary ring-2 ring-primary/20"
      )}
    >
      {/* File type icon */}
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", colorClass)}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Revision chip */}
      {file.revision && file.revision > 1 && (
        <span className="self-start rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          v{file.revision}
        </span>
      )}

      {/* File info */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" title={file.file_name}>{file.file_name}</p>
        <p className="text-xs text-muted-foreground">
          {file.file_type.toUpperCase()}
          {file.file_size_bytes ? ` · ${formatSize(file.file_size_bytes)}` : ""}
        </p>
      </div>

      {/* Comment count */}
      {commentCount !== undefined && commentCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          {commentCount} comment{commentCount !== 1 ? "s" : ""}
        </div>
      )}

      {/* Agency actions — shown on hover */}
      {(canAddRevision || canDeleteFile) && (
        <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
          {canAddRevision && (
            <button
              onClick={(e) => { e.stopPropagation(); onUploadRevision?.(); }}
              title="Upload new revision"
              className="rounded-md bg-background p-1.5 shadow hover:bg-muted"
            >
              <FilePlus2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {/* Delete only in draft */}
          {canDeleteFile && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              title="Delete file"
              className="rounded-md bg-background p-1.5 shadow hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
