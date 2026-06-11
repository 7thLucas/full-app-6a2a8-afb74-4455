import { useState, useEffect, useRef } from "react";
import { X, Mail, Trash2, Search, UserPlus, UserCheck, Users } from "lucide-react";
import { useInvitations } from "../../hooks/use-invitations";
import { apiGet, apiRequest } from "~/lib/api.client";
import { cn } from "~/lib/utils";

interface InviteDialogProps {
  projectId: string;
  currentClientIds?: string[];
  onClose: () => void;
  onClientAdded?: () => void;
}

type Tab = "existing" | "email";

export function InviteDialog({ projectId, currentClientIds = [], onClose, onClientAdded }: InviteDialogProps) {
  const { invitations, loading: invLoading, sendInvitation, revokeInvitation } = useInvitations(projectId);
  const [tab, setTab] = useState<Tab>("existing");

  // Existing client search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Email invite state
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await apiGet(`/api/review-workflow/projects/${projectId}/clients/search`, { q: query });
      if (res.success) setResults(res.data ?? []);
      setSearching(false);
    }, 300);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [query, projectId]);

  async function handleAddClient(userId: string) {
    setAddingId(userId);
    const res = await apiRequest(`/api/review-workflow/projects/${projectId}/clients`, {
      method: "POST",
      data: { userId },
    });
    if (res.success) {
      setAddedIds((prev) => new Set([...prev, userId]));
      setResults((prev) => prev.filter((u) => u._id !== userId));
      onClientAdded?.();
    }
    setAddingId(null);
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setEmailError(null);
    const res = await sendInvitation(email.trim());
    if (res.success) setEmail("");
    else setEmailError(res.message ?? "Failed to send invitation");
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Add Clients</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <TabBtn active={tab === "existing"} onClick={() => setTab("existing")} icon={<Search className="h-4 w-4" />} label="Find registered client" />
          <TabBtn active={tab === "email"} onClick={() => setTab("email")} icon={<Mail className="h-4 w-4" />} label="Invite by email" />
        </div>

        <div className="p-5">
          {tab === "existing" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Search for users who already have a <strong>Client</strong> account.
                They'll be added to the project immediately — no email needed.
              </p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full rounded-md border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="min-h-[120px] space-y-1.5">
                {searching ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Searching…</p>
                ) : results.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {query ? "No clients found matching your search." : "Start typing to search for clients."}
                  </p>
                ) : (
                  results.map((user) => (
                    <div key={user._id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium">
                          {user.profile?.display_name ?? user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <button
                        onClick={() => handleAddClient(user._id)}
                        disabled={addingId === user._id || addedIds.has(user._id)}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
                      >
                        {addedIds.has(user._id) ? (
                          <><UserCheck className="h-3.5 w-3.5" /> Added</>
                        ) : addingId === user._id ? (
                          "Adding…"
                        ) : (
                          <><UserPlus className="h-3.5 w-3.5" /> Add</>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {addedIds.size > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  {addedIds.size} client{addedIds.size > 1 ? "s" : ""} added to this project.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send an invitation link to someone who doesn't have an account yet.
                They'll register as a <strong>Client</strong> and get access to this project.
              </p>

              <form onSubmit={handleSendEmail} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  autoFocus={tab === "email"}
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={sending || !email.trim()}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" />
                  {sending ? "Sending…" : "Send invite"}
                </button>
              </form>

              {emailError && <p className="text-sm text-destructive">{emailError}</p>}

              {/* Pending invitations */}
              {invLoading ? null : invitations.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending invitations</p>
                  <div className="space-y-1.5">
                    {invitations.map((inv) => (
                      <div key={inv._id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{inv.email}</p>
                          <p className={cn("text-xs capitalize", inv.status === "accepted" ? "text-green-600" : "text-muted-foreground")}>
                            {inv.status}
                          </p>
                        </div>
                        {inv.status === "pending" && (
                          <button onClick={() => revokeInvitation(inv._id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {icon} {label}
    </button>
  );
}
