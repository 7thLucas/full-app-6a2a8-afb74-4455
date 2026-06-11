import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "~/components/ui/toast";

interface ActionData { error?: string }

interface AcceptInviteFormProps {
  invitation: { email: string; project_id: { title?: string } };
  mode: "register" | "login";
}

export function AcceptInviteForm({ invitation, mode }: AcceptInviteFormProps) {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (actionData?.error) toast(actionData.error, "error");
  }, [actionData]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold">You've been invited</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          You were invited to review <strong>{invitation.project_id?.title ?? "a project"}</strong>.
          {mode === "register" ? " Create an account to accept." : " Sign in to accept."}
        </p>

        <Form method="post" className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Username</label>
              <input name="username" type="text" required autoComplete="username"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="johndoe" />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input name="email" type="email" required defaultValue={invitation.email}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} required minLength={8}
                className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {submitting ? "Processing…" : mode === "register" ? "Create account & accept" : "Sign in & accept"}
          </button>
        </Form>
      </div>
    </div>
  );
}
