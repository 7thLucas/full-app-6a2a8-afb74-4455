import { useState, useEffect, useCallback } from "react";
import { apiGet } from "~/lib/api.client";

export interface UseProjectFilesOptions {
  basePath?: string;
}

export function useProjectFiles(projectId: string, options: UseProjectFilesOptions = {}) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const basePath = options.basePath ?? "/api/file-review";

  const fetchFiles = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    apiGet(`${basePath}/projects/${projectId}/files`)
      .then((res) => { if (res.success) setFiles(res.data ?? []); else setError(res.message ?? "Failed"); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [basePath, projectId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  return { files, loading, error, refetch: fetchFiles };
}
