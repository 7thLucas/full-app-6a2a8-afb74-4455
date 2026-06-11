import { useState, useEffect, useCallback } from "react";
import { apiGet } from "~/lib/api.client";

export function useProjectDetail(projectId: string) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    apiGet(`/api/review-workflow/projects/${projectId}`)
      .then((res) => { if (res.success) setProject(res.data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { project, loading, refetch: fetchDetail };
}
