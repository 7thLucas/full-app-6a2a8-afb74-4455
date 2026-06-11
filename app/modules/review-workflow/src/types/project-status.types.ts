export enum ProjectStatus {
  Draft = "draft",
  InReview = "in_review",
  InRevision = "in_revision",
  Approved = "approved",
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  [ProjectStatus.Draft]:      "Draft",
  [ProjectStatus.InReview]:   "In Review",
  [ProjectStatus.InRevision]: "In Revision",
  [ProjectStatus.Approved]:   "Approved",
};

export const STATUS_COLOR: Record<ProjectStatus, string> = {
  [ProjectStatus.Draft]:      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  [ProjectStatus.InReview]:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  [ProjectStatus.InRevision]: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  [ProjectStatus.Approved]:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

// Agency actions by current status
export const AGENCY_TRANSITIONS: Partial<Record<ProjectStatus, { to: ProjectStatus; label: string }[]>> = {
  [ProjectStatus.Draft]:      [{ to: ProjectStatus.InReview, label: "Send for Review" }],
  [ProjectStatus.InRevision]: [{ to: ProjectStatus.InReview, label: "Submit for Review" }],
};

// Client actions by current status
export const CLIENT_TRANSITIONS: Partial<Record<ProjectStatus, { to: ProjectStatus; label: string }[]>> = {
  [ProjectStatus.InReview]: [
    { to: ProjectStatus.InRevision, label: "Request Revision" },
    { to: ProjectStatus.Approved,   label: "Approve" },
  ],
};
