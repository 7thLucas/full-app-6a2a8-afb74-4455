export { useProjects } from "./src/hooks/use-projects";
export { useProjectDetail } from "./src/hooks/use-project-detail";
export { useInvitations } from "./src/hooks/use-invitations";
export {
  ProjectStatus,
  STATUS_LABEL,
  STATUS_COLOR,
  AGENCY_TRANSITIONS,
  CLIENT_TRANSITIONS,
} from "./src/types/project-status.types";
export { InvitationStatus } from "./src/types/invitation-status.types";
export { getReviewWorkflowCapabilities } from "./src/types/workflow-capabilities.types";
export type { ReviewWorkflowCapabilities } from "./src/types/workflow-capabilities.types";

// Opinionated demo UI remains available by explicit subpath imports under src/components.
