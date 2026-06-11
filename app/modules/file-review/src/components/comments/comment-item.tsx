import { useState } from "react";
import { CheckCircle, Circle, Trash2, MessageSquare, MapPin, Clock } from "lucide-react";
import { cn } from "~/lib/utils";
import { CommentForm } from "./comment-form";

interface Comment {
  _id: string;
  content: string;
  comment_type?: string;
  author_id: string;
  author?: { _id: string; username?: string; email?: string; profile?: { display_name?: string } };
  createdAt: string;
  resolved: boolean;
  pin_number?: number;
  parent_id?: string;
  timestamp_seconds?: number;
}

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  active: boolean;
  currentUserId?: string;
  onResolve?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (content: string, parentId: string) => Promise<void>;
  onClick: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getAuthorName(comment: Comment) {
  return comment.author?.profile?.display_name ?? comment.author?.username ?? comment.author?.email ?? comment.author_id;
}

export function CommentItem({ comment, replies, active, currentUserId, onResolve, onDelete, onReply, onClick }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const authorName = getAuthorName(comment);
  const isPin = comment.comment_type === "pin";
  const isTimestamp = comment.comment_type === "video_timestamp";

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 cursor-pointer transition-colors",
        active ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Type indicator */}
          {isPin && comment.pin_number && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              {comment.pin_number}
            </span>
          )}
          {isTimestamp && (
            <span className="flex shrink-0 items-center gap-0.5 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
              <Clock className="h-2.5 w-2.5" />
              {formatTime(comment.timestamp_seconds ?? 0)}
            </span>
          )}
          {!isPin && !isTimestamp && (
            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-xs font-medium">{authorName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onResolve && (
            <button
              onClick={(e) => { e.stopPropagation(); onResolve(comment._id); }}
              title={comment.resolved ? "Unresolve" : "Resolve"}
              className="text-muted-foreground hover:text-green-500"
            >
              {comment.resolved
                ? <CheckCircle className="h-4 w-4 text-green-500" />
                : <Circle className="h-4 w-4" />}
            </button>
          )}
          {onDelete && currentUserId === comment.author_id && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(comment._id); }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className={cn("mt-1.5 text-sm", comment.resolved && "line-through text-muted-foreground")}>
        {comment.content}
      </p>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-2 space-y-2 border-l pl-3">
          {replies.map((reply) => (
            <div key={reply._id} className="text-sm">
              <span className="text-xs font-medium">{getAuthorName(reply)}</span>
              <p className="mt-0.5 text-muted-foreground">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {onReply && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setShowReply((v) => !v); }}
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-3 w-3" /> Reply
          </button>
          {showReply && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <CommentForm
                autoFocus
                placeholder="Reply…"
                onSubmit={async (content) => { await onReply(content, comment._id); setShowReply(false); }}
                onCancel={() => setShowReply(false)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
