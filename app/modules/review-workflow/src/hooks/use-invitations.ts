import { useState, useEffect, useCallback } from "react";
import { apiGet, apiRequest } from "~/lib/api.client";

export function useInvitations(projectId: string) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    apiGet(`/api/review-workflow/projects/${projectId}/invitations`)
      .then((res) => { if (res.success) setInvitations(res.data ?? []); })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  async function sendInvitation(email: string) {
    const res = await apiRequest(`/api/review-workflow/projects/${projectId}/invitations`, { method: "POST", data: { email } });
    if (res.success) fetchInvitations();
    return res;
  }

  async function revokeInvitation(invitationId: string) {
    const res = await apiRequest(`/api/review-workflow/invitations/${invitationId}`, { method: "DELETE" });
    if (res.success) fetchInvitations();
    return res;
  }

  return { invitations, loading, refetch: fetchInvitations, sendInvitation, revokeInvitation };
}
