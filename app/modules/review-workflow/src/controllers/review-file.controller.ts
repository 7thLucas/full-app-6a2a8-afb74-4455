import type { Request, Response } from "express";
import { FileType } from "@qb/uploader";
import { ProjectFileService, type FileMetadata } from "~/modules/file-review/src/services/project-file.service";
import { ReviewCommentService } from "~/modules/file-review/src/services/review-comment.service";
import { ReviewCommentModel } from "~/modules/file-review/src/models/review-comment.model";
import { CommentType } from "~/modules/file-review/src/types/comment.types";
import { ReviewProjectService } from "../services/review-project.service";
import { ProjectStatus } from "../types/project-status.types";
import { getReviewWorkflowCapabilities } from "../types/workflow-capabilities.types";

async function getProjectAccess(projectId: string, req: Request): Promise<any> {
  const project = await ReviewProjectService.findPolicyProject(projectId);
  if (!project) return { status: 404, message: "Project not found" };
  if (!ReviewProjectService.canAccess(project, req.user!)) return { status: 403, message: "Forbidden" };
  return { project };
}

async function getFileAccess(fileId: string, req: Request): Promise<any> {
  const file = await ProjectFileService.findById(fileId);
  if (!file) return { status: 404, message: "File not found" };
  const access = await getProjectAccess(file.project_id, req);
  if ("status" in access) return access;
  return { file, project: access.project };
}

async function getCommentAccess(commentId: string, req: Request): Promise<any> {
  const comment = await ReviewCommentModel.findOne({ _id: commentId, deletedAt: null });
  if (!comment) return { status: 404, message: "Comment not found" };
  const access = await getFileAccess(comment.project_file_id.toString(), req);
  if ("status" in access) return access;
  return { comment, file: access.file, project: access.project };
}

function deny(res: Response, result: { status: number; message: string }) {
  res.status(result.status).json({ success: false, message: result.message });
}

function capabilitiesFor(project: any, req: Request) {
  return getReviewWorkflowCapabilities(project.status as ProjectStatus, req.user!.role);
}

export async function getProjectFiles(req: Request, res: Response): Promise<void> {
  try {
    const access = await getProjectAccess(req.params.projectId, req);
    if ("status" in access) return deny(res, access);
    if (!capabilitiesFor(access.project, req).canViewFiles) return deny(res, { status: 403, message: "Forbidden" });
    const files = await ProjectFileService.listByProject(req.params.projectId);
    res.json({ success: true, data: files });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function createProjectFile(req: Request, res: Response): Promise<void> {
  const { file_url, file_name, file_size_bytes, file_type } = req.body;
  if (!file_url || !file_name || !file_type) {
    res.status(400).json({ success: false, message: "file_url, file_name, and file_type are required" });
    return;
  }

  try {
    const access = await getProjectAccess(req.params.projectId, req);
    if ("status" in access) return deny(res, access);
    if (!ReviewProjectService.isAgencyOwner(access.project, req.user!) || !capabilitiesFor(access.project, req).canUpload) {
      return deny(res, { status: 403, message: "Forbidden" });
    }

    const meta: FileMetadata = {
      file_url,
      file_name,
      file_size_bytes: file_size_bytes ? Number(file_size_bytes) : undefined,
      file_type: file_type as FileType,
    };
    const file = await ProjectFileService.createFromUpload({
      projectId: req.params.projectId,
      uploadedBy: req.user!.id,
      meta,
    });
    res.status(201).json({ success: true, data: file });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function addProjectFileRevision(req: Request, res: Response): Promise<void> {
  const { file_url, file_name, file_size_bytes, file_type } = req.body;
  if (!file_url || !file_type) {
    res.status(400).json({ success: false, message: "file_url and file_type are required" });
    return;
  }

  try {
    const access = await getFileAccess(req.params.fileId, req);
    if ("status" in access) return deny(res, access);
    if (!ReviewProjectService.isAgencyOwner(access.project, req.user!) || !capabilitiesFor(access.project, req).canAddRevision) {
      return deny(res, { status: 403, message: "Forbidden" });
    }

    const meta: FileMetadata = {
      file_url,
      file_name: file_name || access.file.file_name,
      file_size_bytes: file_size_bytes ? Number(file_size_bytes) : undefined,
      file_type: file_type as FileType,
    };
    const file = await ProjectFileService.addRevision(req.params.fileId, {
      projectId: access.file.project_id,
      uploadedBy: req.user!.id,
      meta,
    });
    res.status(201).json({ success: true, data: file });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getProjectFileRevisions(req: Request, res: Response): Promise<void> {
  try {
    const access = await getFileAccess(req.params.fileId, req);
    if ("status" in access) return deny(res, access);
    if (!capabilitiesFor(access.project, req).canViewFiles) return deny(res, { status: 403, message: "Forbidden" });
    const revisions = await ProjectFileService.listRevisions(req.params.fileId);
    res.json({ success: true, data: revisions });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function deleteProjectFile(req: Request, res: Response): Promise<void> {
  try {
    const access = await getFileAccess(req.params.fileId, req);
    if ("status" in access) return deny(res, access);
    if (!ReviewProjectService.isAgencyOwner(access.project, req.user!) || !capabilitiesFor(access.project, req).canDeleteFile) {
      return deny(res, { status: 403, message: "Forbidden" });
    }
    await ProjectFileService.softDelete(req.params.fileId);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getProjectFileComments(req: Request, res: Response): Promise<void> {
  try {
    const access = await getFileAccess(req.params.fileId, req);
    if ("status" in access) return deny(res, access);
    if (!capabilitiesFor(access.project, req).canViewFiles) return deny(res, { status: 403, message: "Forbidden" });
    const comments = await ReviewCommentService.listByFile(req.params.fileId);
    res.json({ success: true, data: comments });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function createProjectFileComment(req: Request, res: Response): Promise<void> {
  try {
    const access = await getFileAccess(req.params.fileId, req);
    if ("status" in access) return deny(res, access);
    const capabilities = capabilitiesFor(access.project, req);
    const commentType = req.body.comment_type as CommentType;
    const isAnnotation = commentType === CommentType.Pin || commentType === CommentType.VideoTimestamp;
    if (isAnnotation ? !capabilities.canAnnotate : !capabilities.canComment) {
      return deny(res, { status: 403, message: "Forbidden" });
    }

    const comment = await ReviewCommentService.create({
      ...req.body,
      project_file_id: req.params.fileId,
      author_id: req.user!.id,
      comment_type: commentType,
    });
    res.status(201).json({ success: true, data: comment });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function updateProjectFileComment(req: Request, res: Response): Promise<void> {
  try {
    const access = await getCommentAccess(req.params.commentId, req);
    if ("status" in access) return deny(res, access);
    if (!capabilitiesFor(access.project, req).canComment) return deny(res, { status: 403, message: "Forbidden" });
    const comment = await ReviewCommentService.update(req.params.commentId, req.user!.id, req.body.content);
    if (!comment) return deny(res, { status: 404, message: "Not found" });
    res.json({ success: true, data: comment });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function deleteProjectFileComment(req: Request, res: Response): Promise<void> {
  try {
    const access = await getCommentAccess(req.params.commentId, req);
    if ("status" in access) return deny(res, access);
    if (!capabilitiesFor(access.project, req).canComment) return deny(res, { status: 403, message: "Forbidden" });
    const comment = await ReviewCommentService.softDelete(req.params.commentId, req.user!.id);
    if (!comment) return deny(res, { status: 404, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function resolveProjectFileComment(req: Request, res: Response): Promise<void> {
  try {
    const access = await getCommentAccess(req.params.commentId, req);
    if ("status" in access) return deny(res, access);
    if (!capabilitiesFor(access.project, req).canResolve) return deny(res, { status: 403, message: "Forbidden" });
    const comment = await ReviewCommentService.toggleResolve(req.params.commentId, req.user!.id);
    if (!comment) return deny(res, { status: 404, message: "Not found" });
    res.json({ success: true, data: comment });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}
