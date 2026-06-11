/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  tagline: string;
  logoUrl: string;
  brandColor: TBrandColor;
  agencyName: string;
  supportEmail: string;
  loginWelcomeMessage: string;
  enableGoogleLogin: boolean;
  footerText: string;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Approova",
  tagline: "Where approvals happen.",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#4F46E5",
    secondary: "#10B981",
    accent: "#F59E0B",
  },
  agencyName: "Your Agency",
  supportEmail: "support@approova.com",
  loginWelcomeMessage: "Sign in to your workspace",
  enableGoogleLogin: true,
  footerText: "© 2026 Approova. All rights reserved.",
};
