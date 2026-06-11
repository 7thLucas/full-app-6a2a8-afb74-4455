import type { RefObject, MutableRefObject } from "react";
import { CommentItem } from "./comment-item";

interface CommentListProps {
  comments: any[];
  activeCommentId?: string | null;
  currentUserId?: string;
  activeRef?: MutableRefObject<HTMLDivElement | null>;
  onResolve?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (content: string, parentId: string) => Promise<void>;
  onSelect: (id: string) => void;
}

export function CommentList({ comments, activeCommentId, currentUserId, activeRef, onResolve, onDelete, onReply, onSelect }: CommentListProps) {
  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => !!c.parent_id);

  if (topLevel.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No comments yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {topLevel.map((comment) => (
        <div key={comment._id} ref={activeCommentId === comment._id ? activeRef : undefined}>
          <CommentItem
            comment={comment}
            replies={replies.filter((r) => r.parent_id === comment._id)}
            active={activeCommentId === comment._id}
            currentUserId={currentUserId}
            onResolve={onResolve}
            onDelete={onDelete}
            onReply={onReply}
            onClick={() => onSelect(comment._id)}
          />
        </div>
      ))}
    </div>
  );
}
