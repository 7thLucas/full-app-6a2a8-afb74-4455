import { useState, useEffect, useCallback } from "react";
import { apiGet, apiRequest } from "~/lib/api.client";

export function useProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    apiGet("/api/review-workflow/projects")
      .then((res) => { if (res.success) setProjects(res.data ?? []); else setError(res.message ?? "Failed"); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function createProject(data: { title: string; description?: string; deadline?: string }) {
    const res = await apiRequest("/api/review-workflow/projects", { method: "POST", data });
    if (res.success) fetchProjects();
    return res;
  }

  return { projects, loading, error, refetch: fetchProjects, createProject };
}
