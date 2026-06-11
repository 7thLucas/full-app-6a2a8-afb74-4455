import * as React from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export interface GoogleLoginButtonProps extends React.ComponentPropsWithoutRef<"a"> {
  /** Same-origin path to land on after a successful sign-in (e.g. "/dashboard"). */
  redirectTo?: string;
  /** Override the visible label. */
  label?: string;
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      width="18"
      height="18"
      className="shrink-0"
    >
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.3-.1-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.3 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C41.7 35.1 44 30 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export const GoogleLoginButton = React.forwardRef<HTMLAnchorElement, GoogleLoginButtonProps>(
  ({ redirectTo, label = "Continue with Google", className, ...props }, ref) => {
    const href = redirectTo
      ? `/api/google-auth/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/api/google-auth/login";

    return (
      <Button asChild variant="outline" className={cn("w-full gap-2", className)}>
        <a ref={ref} href={href} {...props}>
          <GoogleMark />
          <span>{label}</span>
        </a>
      </Button>
    );
  }
);
GoogleLoginButton.displayName = "GoogleLoginButton";
