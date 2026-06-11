import { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, MessageSquare, History, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { PdfViewer } from "../viewer/pdf-viewer";
import { ImageViewer } from "../viewer/image-viewer";
import { VideoViewer } from "../viewer/video-viewer";
import { OfficeViewer } from "../viewer/office-viewer";
import { AnnotationLayer } from "../annotations/annotation-layer";
import type { Region } from "../annotations/annotation-layer";
import { CommentList } from "../comments/comment-list";
import { CommentForm } from "../comments/comment-form";
import { useFileComments } from "../../hooks/use-file-comments";
import { CommentType } from "../../types/comment.types";
import { apiGet } from "~/lib/api.client";
import { cn } from "~/lib/utils";

interface FileViewerProps {
  file: { _id: string; file_name: string; file_type: string; file_url: string; revision?: number };
  canAnnotate?: boolean;
  canComment?: boolean;
  canResolve?: boolean;
  readOnly?: boolean;
  currentUserId?: string;
  onClose: () => void;
}

function getUploaderName(file: any) {
  return file.uploader?.username ?? file.uploader?.email ?? file.uploaded_by ?? "";
}

export function FileViewer({
  file,
  canAnnotate = false,
  canComment = true,
  canResolve = true,
  readOnly = false,
  currentUserId,
  onClose,
}: FileViewerProps) {
  const { comments, loading, addComment, resolveComment, deleteComment } = useFileComments(file._id);

  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [pendingRegion, setPendingRegion] = useState<Region | null>(null);
  const [videoTimestamp, setVideoTimestamp] = useState<number | null>(null);
  const [annotating, setAnnotating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const activeRef = useRef<HTMLDivElement | null>(null);

  const supportsAnnotation = file.file_type === "pdf" || file.file_type === "image";
  const openCount = comments.filter((c) => !c.resolved && !c.parent_id).length;

  const annotationAllowed = canAnnotate && !readOnly && supportsAnnotation;
  const commentingAllowed = canComment && !readOnly;

  useEffect(() => {
    if (activeCommentId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeCommentId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  async function fetchRevisions() {
    setRevisionsLoading(true);
    const res = await apiGet(`/api/file-review/files/${file._id}/revisions`);
    if (res.success) setRevisions(res.data ?? []);
    setRevisionsLoading(false);
  }

  function toggleHistory() {
    if (!showHistory && revisions.length === 0) fetchRevisions();
    setShowHistory((v) => !v);
  }

  async function handleAddComment(content: string, region?: Region) {
    const isPin = !!region;
    const isVideo = videoTimestamp !== null && !region;

    await addComment({
      content,
      comment_type: isPin ? CommentType.Pin : isVideo ? CommentType.VideoTimestamp : CommentType.Text,
      page: region ? page : undefined,
      x: region?.x, y: region?.y, width: region?.width, height: region?.height,
      timestamp_seconds: isVideo ? videoTimestamp! : undefined,
    });

    setPendingRegion(null);
    setVideoTimestamp(null);
    setAnnotating(false);
  }

  async function handleReply(content: string, parentId: string) {
    await addComment({ content, comment_type: CommentType.Text, parent_id: parentId });
  }

  function captureVideoTimestamp() {
    const vid = document.querySelector("video") as HTMLVideoElement | null;
    if (vid) setVideoTimestamp(Math.floor(vid.currentTime));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2.5 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="shrink-0 rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
          <span className="truncate font-medium text-sm">{file.file_name}</span>
          {file.revision && file.revision > 1 && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">v{file.revision}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* History toggle */}
          <button
            onClick={toggleHistory}
            className={cn("flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted", showHistory && "bg-muted")}
            title="Revision history"
          >
            <History className="h-3.5 w-3.5" />
            History
            {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Zoom controls */}
          {(file.file_type === "pdf" || file.file_type === "image") && (
            <div className="flex items-center gap-1 border-l pl-2">
              <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} className="rounded p-1.5 hover:bg-muted">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="rounded p-1.5 hover:bg-muted">
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Revision history panel */}
      {showHistory && (
        <div className="shrink-0 border-b bg-muted/20 px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revision History</p>
          {revisionsLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : revisions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No revisions found.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {revisions.map((rev) => (
                <div
                  key={rev._id}
                  className={cn(
                    "shrink-0 rounded-lg border bg-card px-3 py-2 text-xs",
                    rev._id === file._id && "border-primary ring-1 ring-primary/30"
                  )}
                >
                  <p className="font-medium">v{rev.revision}</p>
                  <p className="text-muted-foreground truncate max-w-32">{rev.file_name}</p>
                  <p className="text-muted-foreground">{new Date(rev.createdAt).toLocaleDateString()}</p>
                  {rev.uploaded_by && (
                    <p className="text-muted-foreground truncate max-w-32">{getUploaderName(rev)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Viewer */}
        <div className="relative flex flex-1 min-h-0 flex-col overflow-auto bg-muted/20 p-4">
          {/* Mark Region button — client only, in_review only */}
          {annotationAllowed && (
            <div className="absolute left-3 top-3 z-20">
              <button
                onClick={() => setAnnotating((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium shadow transition-colors",
                  annotating
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-background border hover:bg-muted text-foreground"
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
                {annotating ? "Drawing… click to cancel" : "Mark Region"}
              </button>
            </div>
          )}

          <div className="relative mx-auto inline-block select-none">
            {file.file_type === "pdf" && (
              <PdfViewer url={file.file_url} page={page} zoom={zoom} onDocumentLoad={setTotalPages} onPageChange={setPage} />
            )}
            {file.file_type === "image" && <ImageViewer url={file.file_url} zoom={zoom} />}
            {file.file_type === "video" && <VideoViewer url={file.file_url} />}
            {(file.file_type === "office" || !["pdf","image","video"].includes(file.file_type)) && <OfficeViewer url={file.file_url} />}

            {supportsAnnotation && (
              <AnnotationLayer
                annotations={comments}
                currentPage={page}
                activeCommentId={activeCommentId}
                canAnnotate={annotationAllowed}
                annotating={annotating}
                onAnnotationClick={(id) => { setActiveCommentId(id); setPendingRegion(null); }}
                onRegionDraw={(region) => { setPendingRegion(region); setActiveCommentId(null); setAnnotating(false); }}
              />
            )}
          </div>

          {file.file_type === "video" && commentingAllowed && (
            <button
              onClick={captureVideoTimestamp}
              className="mx-auto mt-3 flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
            >
              <MessageSquare className="h-4 w-4" />
              Comment at current timestamp
            </button>
          )}
        </div>

        {/* Comment panel */}
        <div className="flex w-80 shrink-0 min-h-0 flex-col border-l bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Comments</span>
              {openCount > 0 && (
                <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-600">
                  {openCount} open
                </span>
              )}
            </div>
          </div>

          {/* Pending region / timestamp form */}
          {commentingAllowed && (pendingRegion || videoTimestamp !== null) && (
            <div className="border-b bg-blue-50 dark:bg-blue-950/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {pendingRegion ? "Region selected" : `Timestamp: ${videoTimestamp}s`} — add comment
                </span>
                <button onClick={() => { setPendingRegion(null); setVideoTimestamp(null); setAnnotating(false); }}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <CommentForm
                autoFocus
                placeholder="Describe this…"
                onSubmit={(content) => handleAddComment(content, pendingRegion ?? undefined)}
                onCancel={() => { setPendingRegion(null); setVideoTimestamp(null); setAnnotating(false); }}
              />
            </div>
          )}

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
              <CommentList
                comments={comments}
                activeCommentId={activeCommentId}
                currentUserId={currentUserId}
                activeRef={activeRef}
                onResolve={canResolve && !readOnly ? resolveComment : undefined}
                onDelete={!readOnly ? deleteComment : undefined}
                onReply={commentingAllowed ? handleReply : undefined}
                onSelect={(id) => { setActiveCommentId(id); setPendingRegion(null); }}
              />
            )}
          </div>

          {/* General comment */}
          {commentingAllowed && (
          <div className="border-t p-3">
            <CommentForm
              placeholder="General comment…"
              onSubmit={(content) => handleAddComment(content)}
            />
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
