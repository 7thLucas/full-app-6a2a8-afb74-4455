import { UserRole } from "~/modules/authentication/authentication.types";
import {
  AGENCY_TRANSITIONS,
  CLIENT_TRANSITIONS,
  ProjectStatus,
} from "./project-status.types";

export interface ReviewWorkflowCapabilities {
  canViewFiles: boolean;
  canUpload: boolean;
  canAddRevision: boolean;
  canDeleteFile: boolean;
  canAnnotate: boolean;
  canComment: boolean;
  canResolve: boolean;
  canApprove: boolean;
  canRequestRevision: boolean;
  canManageClients: boolean;
  readOnly: boolean;
  transitions: { to: ProjectStatus; label: string }[];
}

function isAgencyRole(role?: UserRole | string | null) {
  return role === UserRole.Agency || role === UserRole.Admin || role === "admin";
}

function isClientRole(role?: UserRole | string | null) {
  return role === UserRole.Client;
}

export function getReviewWorkflowCapabilities(
  status: ProjectStatus | string | undefined,
  role?: UserRole | string | null,
): ReviewWorkflowCapabilities {
  const projectStatus = (status ?? ProjectStatus.Draft) as ProjectStatus;
  const agency = isAgencyRole(role);
  const client = isClientRole(role);
  const readOnly = projectStatus === ProjectStatus.Approved;

  const transitions = agency
    ? AGENCY_TRANSITIONS[projectStatus] ?? []
    : client
      ? CLIENT_TRANSITIONS[projectStatus] ?? []
      : [];

  return {
    canViewFiles: agency || (client && projectStatus !== ProjectStatus.Draft),
    canUpload: agency && (projectStatus === ProjectStatus.Draft || projectStatus === ProjectStatus.InRevision),
    canAddRevision: agency && projectStatus === ProjectStatus.InRevision,
    canDeleteFile: agency && projectStatus === ProjectStatus.Draft,
    canAnnotate: client && projectStatus === ProjectStatus.InReview,
    canComment: !readOnly && (agency || (client && projectStatus !== ProjectStatus.Draft)),
    canResolve: !readOnly && (agency || client),
    canApprove: client && projectStatus === ProjectStatus.InReview,
    canRequestRevision: client && projectStatus === ProjectStatus.InReview,
    canManageClients: agency,
    readOnly,
    transitions,
  };
}
