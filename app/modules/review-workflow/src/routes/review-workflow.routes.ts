import { Router } from "express";
import { requireAuth, requireRole } from "~/modules/authentication/authentication.middleware";
import { UserRole } from "~/modules/authentication/authentication.types";
import {
  getProjects, getProject, createProject, updateProject, deleteProject,
  searchClients, addClientDirect, removeClient, transitionProjectStatus,
} from "../controllers/review-project.controller";
import { sendInvitation, getInvitations, revokeInvitation, validateInviteToken, acceptInvitation } from "../controllers/review-invitation.controller";
import {
  addProjectFileRevision,
  createProjectFile,
  createProjectFileComment,
  deleteProjectFile,
  deleteProjectFileComment,
  getProjectFileComments,
  getProjectFileRevisions,
  getProjectFiles,
  resolveProjectFileComment,
  updateProjectFileComment,
} from "../controllers/review-file.controller";

const router = Router();

// Projects
router.get("/review-workflow/projects", requireAuth, getProjects);
router.post("/review-workflow/projects", requireRole(UserRole.Agency), createProject);
router.get("/review-workflow/projects/:projectId", requireAuth, getProject);
router.patch("/review-workflow/projects/:projectId", requireRole(UserRole.Agency), updateProject);
router.delete("/review-workflow/projects/:projectId", requireRole(UserRole.Agency), deleteProject);

// Status transitions (role-checked in controller)
router.patch("/review-workflow/projects/:projectId/status", requireAuth, transitionProjectStatus);

// Project files and comments
router.get("/review-workflow/projects/:projectId/files", requireAuth, getProjectFiles);
router.post("/review-workflow/projects/:projectId/files", requireRole(UserRole.Agency), createProjectFile);
router.post("/review-workflow/files/:fileId/revisions", requireRole(UserRole.Agency), addProjectFileRevision);
router.get("/review-workflow/files/:fileId/revisions", requireAuth, getProjectFileRevisions);
router.delete("/review-workflow/files/:fileId", requireRole(UserRole.Agency), deleteProjectFile);
router.get("/review-workflow/files/:fileId/comments", requireAuth, getProjectFileComments);
router.post("/review-workflow/files/:fileId/comments", requireAuth, createProjectFileComment);
router.patch("/review-workflow/comments/:commentId", requireAuth, updateProjectFileComment);
router.delete("/review-workflow/comments/:commentId", requireAuth, deleteProjectFileComment);
router.patch("/review-workflow/comments/:commentId/resolve", requireAuth, resolveProjectFileComment);

// Client management
router.get("/review-workflow/projects/:projectId/clients/search", requireRole(UserRole.Agency), searchClients);
router.post("/review-workflow/projects/:projectId/clients", requireRole(UserRole.Agency), addClientDirect);
router.delete("/review-workflow/projects/:projectId/clients/:userId", requireRole(UserRole.Agency), removeClient);

// Invitations
router.post("/review-workflow/projects/:projectId/invitations", requireRole(UserRole.Agency), sendInvitation);
router.get("/review-workflow/projects/:projectId/invitations", requireAuth, getInvitations);
router.delete("/review-workflow/invitations/:invitationId", requireRole(UserRole.Agency), revokeInvitation);
router.get("/review-workflow/invitations/accept/:token", validateInviteToken);
router.post("/review-workflow/invitations/accept/:token", acceptInvitation);

export default router;
