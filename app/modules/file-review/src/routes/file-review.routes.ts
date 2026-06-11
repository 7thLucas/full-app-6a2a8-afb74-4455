import { Router } from "express";
import { requireAuth, requireRole } from "~/modules/authentication/authentication.middleware";
import { UserRole } from "~/modules/authentication/authentication.types";
import {
  getFiles, uploadFile, addRevision, deleteFile, getFileRevisions,
} from "../controllers/project-file.controller";
import { getComments, createComment, updateComment, deleteComment, resolveComment } from "../controllers/review-comment.controller";

const router = Router();

router.use("/file-review", requireAuth);

// Project files
router.get("/file-review/projects/:projectId/files", getFiles);
router.post("/file-review/projects/:projectId/files", requireRole(UserRole.Agency), uploadFile);

// Revisions
router.post("/file-review/files/:fileId/revisions", requireRole(UserRole.Agency), addRevision);
router.get("/file-review/files/:fileId/revisions", getFileRevisions);

// Delete
router.delete("/file-review/files/:fileId", requireRole(UserRole.Agency), deleteFile);

// Comments
router.get("/file-review/files/:fileId/comments", getComments);
router.post("/file-review/files/:fileId/comments", createComment);
router.patch("/file-review/comments/:commentId", updateComment);
router.delete("/file-review/comments/:commentId", deleteComment);
router.patch("/file-review/comments/:commentId/resolve", resolveComment);

export default router;
