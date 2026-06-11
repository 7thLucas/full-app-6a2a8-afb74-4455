import { useState, useEffect, useCallback } from "react";
import { apiGet, apiRequest } from "~/lib/api.client";

export function useReviewComments(versionId: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(() => {
    if (!versionId) return;
    setLoading(true);
    apiGet(`/api/file-review/versions/${versionId}/comments`)
      .then((res) => { if (res.success) setComments(res.data ?? []); else setError(res.message ?? "Failed"); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [versionId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function addComment(data: { review_item_id: string; content: string; page?: number; x?: number; y?: number; width?: number; height?: number; parent_id?: string }) {
    const res = await apiRequest(`/api/file-review/versions/${versionId}/comments`, { method: "POST", data });
    if (res.success) fetchComments();
    return res;
  }

  async function resolveComment(commentId: string) {
    const res = await apiRequest(`/api/file-review/comments/${commentId}/resolve`, { method: "PATCH" });
    if (res.success) fetchComments();
    return res;
  }

  async function deleteComment(commentId: string) {
    const res = await apiRequest(`/api/file-review/comments/${commentId}`, { method: "DELETE" });
    if (res.success) fetchComments();
    return res;
  }

  return { comments, loading, error, refetch: fetchComments, addComment, resolveComment, deleteComment };
}
