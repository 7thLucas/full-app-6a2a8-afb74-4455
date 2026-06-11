import crypto from "node:crypto";
import { ReviewInvitationModel, InvitationStatus } from "../models/review-invitation.model";
import { ReviewProjectModel } from "../models/review-project.model";
import { UserModel } from "~/modules/authentication/authentication.model";
import { ReviewProjectService } from "./review-project.service";
import type { PublicUser } from "~/modules/authentication/authentication.types";

export class ReviewInvitationService {
  static async create(projectId: string, email: string) {
    const existing = await ReviewInvitationModel.findOne({
      project_id: projectId,
      email: email.toLowerCase(),
      status: InvitationStatus.Pending,
    });
    if (existing) throw Object.assign(new Error("Invitation already sent to this email"), { statusCode: 409 });

    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await ReviewInvitationModel.create({
      project_id: projectId,
      email,
      token,
      expires_at,
      status: InvitationStatus.Pending,
    });

    return invitation;
  }

  static async listByProject(projectId: string) {
    return ReviewInvitationModel.find({ project_id: projectId, deletedAt: null }).sort({ createdAt: -1 });
  }

  static async revoke(invitationId: string) {
    return ReviewInvitationModel.findOneAndUpdate(
      { _id: invitationId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
  }

  static async canManageInvitation(invitationId: string, user: PublicUser) {
    const invitation = await ReviewInvitationModel.findOne({ _id: invitationId, deletedAt: null }).select("project_id");
    if (!invitation) return false;
    return ReviewProjectService.canManageProject(invitation.project_id.toString(), user);
  }

  static async validateToken(token: string) {
    const invitation = await ReviewInvitationModel.findOne({ token })
      .populate("project_id", "title agency_id");

    if (!invitation) throw Object.assign(new Error("Invalid invitation token"), { statusCode: 404 });
    if (invitation.status === InvitationStatus.Accepted) throw Object.assign(new Error("Invitation already accepted"), { statusCode: 410 });
    if (new Date() > invitation.expires_at) {
      await ReviewInvitationModel.findByIdAndUpdate(invitation._id, { $set: { status: InvitationStatus.Expired } });
      throw Object.assign(new Error("Invitation has expired"), { statusCode: 410 });
    }

    return invitation;
  }

  static async accept(token: string, userId: string) {
    const invitation = await ReviewInvitationService.validateToken(token);

    await ReviewInvitationModel.findByIdAndUpdate(invitation._id, {
      $set: { status: InvitationStatus.Accepted, accepted_at: new Date(), accepted_by: userId },
    });

    await ReviewProjectService.addClient(invitation.project_id.toString(), userId);

    return invitation;
  }
}
