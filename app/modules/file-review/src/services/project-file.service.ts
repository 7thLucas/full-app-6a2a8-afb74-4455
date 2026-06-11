import { ProjectFileModel } from "../models/project-file.model";
import { FileType } from "@qb/uploader";

interface UserSummary {
  _id: string;
  username?: string;
  email?: string;
  profile?: Record<string, any>;
}

export interface FileMetadata {
  file_url: string;
  file_name: string;
  file_size_bytes?: number;
  file_type: FileType;
}

function refId(ref: any): string {
  if (typeof ref === "string") return ref;
  return ref?._id?.toString() ?? ref?.toString() ?? "";
}

function userSummary(ref: any): UserSummary | undefined {
  if (!ref || typeof ref === "string" || !ref._id) return undefined;
  return {
    _id: ref._id.toString(),
    username: ref.username,
    email: ref.email,
    profile: ref.profile,
  };
}

function toPublicProjectFile(file: any) {
  if (!file) return null;
  return {
    ...file,
    _id: file._id?.toString?.() ?? file._id,
    root_file_id: file.root_file_id ? refId(file.root_file_id) : undefined,
    uploaded_by: refId(file.uploaded_by),
    uploader: userSummary(file.uploaded_by),
  };
}

export class ProjectFileService {
  static async listByProject(projectId: string) {
    const files = await ProjectFileModel.find({ project_id: projectId, is_current: true, deletedAt: null })
      .populate("uploaded_by", "username email profile")
      .sort({ createdAt: 1 })
      .lean();
    return files.map(toPublicProjectFile);
  }

  static async listRevisions(fileId: string) {
    const file = await ProjectFileModel.findById(fileId).select("root_file_id");
    if (!file) return [];
    const rootId = (file.root_file_id ?? fileId).toString();
    const revisions = await ProjectFileModel.find({
      $or: [{ _id: rootId }, { root_file_id: rootId }],
      deletedAt: null,
    })
      .populate("uploaded_by", "username email profile")
      .sort({ revision: 1 })
      .lean();
    return revisions.map(toPublicProjectFile);
  }

  static async findById(fileId: string) {
    const file = await ProjectFileModel.findOne({ _id: fileId, deletedAt: null })
      .populate("uploaded_by", "username email profile")
      .lean();
    return toPublicProjectFile(file);
  }

  static async createFromUpload(params: {
    projectId: string;
    uploadedBy: string;
    meta: FileMetadata;
  }) {
    const file = await ProjectFileModel.create({
      project_id: params.projectId,
      file_url: params.meta.file_url,
      file_name: params.meta.file_name,
      file_size_bytes: params.meta.file_size_bytes,
      file_type: params.meta.file_type,
      uploaded_by: params.uploadedBy,

      revision: 1,
      is_current: true,
    });
    return this.findById(file._id.toString());
  }

  static async addRevision(fileId: string, params: {
    projectId: string;
    uploadedBy: string;
    meta: FileMetadata;
  }) {
    const existing = await ProjectFileModel.findOne({ _id: fileId, deletedAt: null });
    if (!existing) return null;

    const rootId = (existing.root_file_id ?? existing._id).toString();
    await ProjectFileModel.findByIdAndUpdate(fileId, { $set: { is_current: false } });

    const file = await ProjectFileModel.create({
      project_id: params.projectId,
      file_url: params.meta.file_url,
      file_name: existing.file_name,
      file_size_bytes: params.meta.file_size_bytes,
      file_type: params.meta.file_type,
      uploaded_by: params.uploadedBy,

      root_file_id: rootId,
      revision: existing.revision + 1,
      is_current: true,
    });
    return this.findById(file._id.toString());
  }

  static async softDelete(fileId: string) {
    const file = await ProjectFileModel.findOne({ _id: fileId });
    if (!file) return null;
    const rootId = (file.root_file_id ?? file._id).toString();
    await ProjectFileModel.updateMany(
      { $or: [{ _id: rootId }, { root_file_id: rootId }] },
      { $set: { deletedAt: new Date(), is_current: false } }
    );
    return file;
  }
}
