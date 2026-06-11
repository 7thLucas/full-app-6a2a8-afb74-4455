import { ReviewProjectModel, ProjectStatus, STATUS_TRANSITIONS } from "../models/review-project.model";
import { UserModel } from "~/modules/authentication/authentication.model";
import { UserRole, type PublicUser } from "~/modules/authentication/authentication.types";

function idOf(value: any) {
  return (value?._id ?? value)?.toString();
}

export class ReviewProjectService {
  static async listForUser(userId: string, role: string) {
    if (role === "agency" || role === "admin") {
      return ReviewProjectModel.find({ agency_id: userId, deletedAt: null }).sort({ createdAt: -1 });
    }
    return ReviewProjectModel.find({ client_ids: userId, deletedAt: null }).sort({ createdAt: -1 });
  }

  static async findById(projectId: string) {
    return ReviewProjectModel.findOne({ _id: projectId, deletedAt: null })
      .populate("agency_id", "username email profile")
      .populate("client_ids", "username email profile");
  }

  static async findPolicyProject(projectId: string) {
    return ReviewProjectModel.findOne({ _id: projectId, deletedAt: null }).select("agency_id client_ids status");
  }

  static isAgencyOwner(project: any, user: PublicUser) {
    return user.role === UserRole.Admin || (user.role === UserRole.Agency && idOf(project.agency_id) === user.id);
  }

  static isClientMember(project: any, user: PublicUser) {
    return user.role === UserRole.Client && (project.client_ids ?? []).some((clientId: any) => idOf(clientId) === user.id);
  }

  static canAccess(project: any, user: PublicUser) {
    return ReviewProjectService.isAgencyOwner(project, user) || ReviewProjectService.isClientMember(project, user);
  }

  static async canAccessProject(projectId: string, user: PublicUser) {
    const project = await ReviewProjectService.findPolicyProject(projectId);
    return !!project && ReviewProjectService.canAccess(project, user);
  }

  static async canManageProject(projectId: string, user: PublicUser) {
    const project = await ReviewProjectService.findPolicyProject(projectId);
    return !!project && ReviewProjectService.isAgencyOwner(project, user);
  }

  static async create(data: { title: string; description?: string; deadline?: Date; agency_id: string }) {
    return ReviewProjectModel.create({ ...data, status: ProjectStatus.Draft });
  }

  static async update(projectId: string, data: Partial<{ title: string; description: string; deadline: Date }>) {
    return ReviewProjectModel.findOneAndUpdate(
      { _id: projectId, deletedAt: null },
      { $set: data },
      { new: true }
    );
  }

  static async transitionStatus(projectId: string, toStatus: ProjectStatus) {
    const project = await ReviewProjectModel.findOne({ _id: projectId, deletedAt: null });
    if (!project) return null;

    const allowed = STATUS_TRANSITIONS[project.status as ProjectStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new Error(`Cannot transition from "${project.status}" to "${toStatus}"`);
    }

    const update: Record<string, any> = { status: toStatus };
    // Increment round when agency re-submits for review after a revision cycle
    if (toStatus === ProjectStatus.InReview && project.status === ProjectStatus.InRevision) {
      update.round = (project.round ?? 1) + 1;
    }

    return ReviewProjectModel.findByIdAndUpdate(projectId, { $set: update }, { new: true });
  }

  static async addClient(projectId: string, userId: string) {
    return ReviewProjectModel.findByIdAndUpdate(
      projectId,
      { $addToSet: { client_ids: userId } },
      { new: true }
    );
  }

  static async removeClient(projectId: string, userId: string) {
    return ReviewProjectModel.findByIdAndUpdate(
      projectId,
      { $pull: { client_ids: userId } },
      { new: true }
    );
  }

  static async searchClients(query: string, excludeIds: string[] = []) {
    const filter: Record<string, any> = { role: UserRole.Client, is_active: true };
    if (query.trim()) {
      filter.$or = [
        { email: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ];
    }
    if (excludeIds.length) filter._id = { $nin: excludeIds };
    return UserModel.find(filter).select("_id username email profile").limit(20);
  }
}
