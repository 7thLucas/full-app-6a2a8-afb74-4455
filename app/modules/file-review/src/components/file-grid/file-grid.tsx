import { useRef } from "react";
import { Upload, Plus } from "lucide-react";
import { FileCard } from "./file-card";
import { useFileUpload } from "../../hooks/use-file-upload";
import { cn } from "~/lib/utils";

interface FileGridProps {
  projectId: string;
  files: any[];
  loading: boolean;
  canUpload?: boolean;
  canAddRevision?: boolean;
  canDeleteFile?: boolean;
  activeFileId?: string | null;
  onFileSelect: (file: any) => void;
  onFilesUploaded: () => void;
  onUploadRevision: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
}

export function FileGrid({
  projectId, files, loading, canUpload = false, canAddRevision = false, canDeleteFile = false, activeFileId,
  onFileSelect, onFilesUploaded, onUploadRevision, onDeleteFile,
}: FileGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress } = useFileUpload(projectId);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    for (const file of Array.from(fileList)) {
      await upload(file);
    }
    onFilesUploaded();
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload zone (agency in draft or in_revision) */}
      {canUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.mov,.docx,.xlsx,.pptx"
          />
          {uploading ? (
            <>
              <Upload className="h-6 w-6 animate-bounce text-primary" />
              <p className="text-sm font-medium">Uploading… {progress}%</p>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">PDF, images, video, office files - up to 20MB each</p>
            </>
          )}
        </div>
      )}

      {/* File grid */}
      {files.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {canUpload ? "No files yet. Upload files above." : "No files uploaded yet."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <FileCard
              key={file._id}
              file={file}
              canAddRevision={canAddRevision}
              canDeleteFile={canDeleteFile}
              active={activeFileId === file._id}
              onClick={() => onFileSelect(file)}
              onUploadRevision={() => onUploadRevision(file._id)}
              onDelete={() => onDeleteFile(file._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
