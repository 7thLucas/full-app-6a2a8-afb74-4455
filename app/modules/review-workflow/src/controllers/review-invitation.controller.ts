import type { Request, Response } from "express";
import { ReviewInvitationService } from "../services/review-invitation.service";
import { ReviewProjectService } from "../services/review-project.service";

export async function sendInvitation(req: Request, res: Response): Promise<void> {
  try {
    if (!await ReviewProjectService.canManageProject(req.params.projectId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    const invitation = await ReviewInvitationService.create(req.params.projectId, req.body.email);
    res.status(201).json({ success: true, data: invitation });
  } catch (e: any) { res.status(e.statusCode ?? 500).json({ success: false, message: e.message }); }
}

export async function getInvitations(req: Request, res: Response): Promise<void> {
  try {
    if (!await ReviewProjectService.canAccessProject(req.params.projectId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    const invitations = await ReviewInvitationService.listByProject(req.params.projectId);
    res.json({ success: true, data: invitations });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function revokeInvitation(req: Request, res: Response): Promise<void> {
  try {
    if (!await ReviewInvitationService.canManageInvitation(req.params.invitationId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    await ReviewInvitationService.revoke(req.params.invitationId);
    res.json({ success: true, message: "Invitation revoked" });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function validateInviteToken(req: Request, res: Response): Promise<void> {
  try {
    const invitation = await ReviewInvitationService.validateToken(req.params.token);
    res.json({ success: true, data: invitation });
  } catch (e: any) { res.status(e.statusCode ?? 500).json({ success: false, message: e.message }); }
}

export async function acceptInvitation(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id ?? req.body.user_id;
    if (!userId) { res.status(400).json({ success: false, message: "user_id required" }); return; }
    const invitation = await ReviewInvitationService.accept(req.params.token, userId);
    res.json({ success: true, data: invitation });
  } catch (e: any) { res.status(e.statusCode ?? 500).json({ success: false, message: e.message }); }
}
