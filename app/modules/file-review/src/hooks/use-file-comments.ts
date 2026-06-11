import { useState, useEffect, useCallback } from "react";
import { apiGet, apiRequest } from "~/lib/api.client";
import type { CommentType } from "../types/comment.types";

export interface UseFileCommentsOptions {
  basePath?: string;
}

export function useFileComments(fileId: string, options: UseFileCommentsOptions = {}) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const basePath = options.basePath ?? "/api/file-review";

  const fetchComments = useCallback(() => {
    if (!fileId) return;
    setLoading(true);
    apiGet(`${basePath}/files/${fileId}/comments`)
      .then((res) => { if (res.success) setComments(res.data ?? []); else setError(res.message ?? "Failed"); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [basePath, fileId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function addComment(data: {
    content: string;
    comment_type?: CommentType;
    page?: number;
    x?: number; y?: number; width?: number; height?: number;
    timestamp_seconds?: number;
    parent_id?: string;
  }) {
    const res = await apiRequest(`${basePath}/files/${fileId}/comments`, { method: "POST", data });
    if (res.success) fetchComments();
    return res;
  }

  async function resolveComment(commentId: string) {
    const res = await apiRequest(`${basePath}/comments/${commentId}/resolve`, { method: "PATCH" });
    if (res.success) fetchComments();
    return res;
  }

  async function deleteComment(commentId: string) {
    const res = await apiRequest(`${basePath}/comments/${commentId}`, { method: "DELETE" });
    if (res.success) fetchComments();
    return res;
  }

  return { comments, loading, error, refetch: fetchComments, addComment, resolveComment, deleteComment };
}
