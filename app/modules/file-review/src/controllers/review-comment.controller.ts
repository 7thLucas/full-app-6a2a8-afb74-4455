import type { Request, Response } from "express";
import { ReviewCommentService } from "../services/review-comment.service";
import type { CommentType } from "../types/comment.types";

export async function getComments(req: Request, res: Response): Promise<void> {
  try {
    const comments = await ReviewCommentService.listByFile(req.params.fileId);
    res.json({ success: true, data: comments });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function createComment(req: Request, res: Response): Promise<void> {
  try {
    const comment = await ReviewCommentService.create({
      ...req.body,
      project_file_id: req.params.fileId,
      author_id: req.user!.id,
      comment_type: req.body.comment_type as CommentType,
    });
    res.status(201).json({ success: true, data: comment });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function updateComment(req: Request, res: Response): Promise<void> {
  try {
    const comment = await ReviewCommentService.update(req.params.commentId, req.user!.id, req.body.content);
    if (!comment) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: comment });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  try {
    const comment = await ReviewCommentService.softDelete(req.params.commentId, req.user!.id);
    if (!comment) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function resolveComment(req: Request, res: Response): Promise<void> {
  try {
    const comment = await ReviewCommentService.toggleResolve(req.params.commentId, req.user!.id);
    if (!comment) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: comment });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}
