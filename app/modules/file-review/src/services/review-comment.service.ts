import { ReviewCommentModel } from "../models/review-comment.model";
import { CommentType } from "../types/comment.types";

interface UserSummary {
  _id: string;
  username?: string;
  email?: string;
  profile?: Record<string, any>;
  role?: string;
}

function refId(ref: any): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === "string") return ref;
  return ref?._id?.toString() ?? ref?.toString();
}

function userSummary(ref: any): UserSummary | undefined {
  if (!ref || typeof ref === "string" || !ref._id) return undefined;
  return {
    _id: ref._id.toString(),
    username: ref.username,
    email: ref.email,
    profile: ref.profile,
    role: ref.role,
  };
}

function toPublicComment(comment: any) {
  if (!comment) return null;
  return {
    ...comment,
    _id: comment._id?.toString?.() ?? comment._id,
    project_file_id: refId(comment.project_file_id),
    author_id: refId(comment.author_id),
    author: userSummary(comment.author_id),
    parent_id: refId(comment.parent_id),
    resolved_by: refId(comment.resolved_by),
    resolver: userSummary(comment.resolved_by),
  };
}

export class ReviewCommentService {
  static async listByFile(projectFileId: string) {
    const comments = await ReviewCommentModel.find({ project_file_id: projectFileId, deletedAt: null })
      .populate("author_id", "username email profile role")
      .populate("resolved_by", "username email")
      .sort({ createdAt: 1 })
      .lean();
    return comments.map(toPublicComment);
  }

  private static async findPublicById(id: string) {
    const comment = await ReviewCommentModel.findOne({ _id: id, deletedAt: null })
      .populate("author_id", "username email profile role")
      .populate("resolved_by", "username email")
      .lean();
    return toPublicComment(comment);
  }

  static async create(data: {
    project_file_id: string;
    content: string;
    author_id: string;
    comment_type?: CommentType;
    page?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    timestamp_seconds?: number;
    parent_id?: string;
  }) {
    let pin_number: number | undefined;
    const isPin = data.comment_type === CommentType.Pin && data.x !== undefined && !data.parent_id;
    if (isPin) {
      const last = await ReviewCommentModel.findOne({
        project_file_id: data.project_file_id,
        comment_type: CommentType.Pin,
        parent_id: { $exists: false },
        deletedAt: null,
      }).sort({ pin_number: -1 });
      pin_number = (last?.pin_number ?? 0) + 1;
    }
    const comment = await ReviewCommentModel.create({ ...data, pin_number, resolved: false });
    return this.findPublicById(comment._id.toString());
  }

  static async update(id: string, authorId: string, content: string) {
    const comment = await ReviewCommentModel.findOneAndUpdate(
      { _id: id, author_id: authorId, deletedAt: null },
      { $set: { content } },
      { new: true }
    );
    return comment ? this.findPublicById(comment._id.toString()) : null;
  }

  static async softDelete(id: string, authorId: string) {
    return ReviewCommentModel.findOneAndUpdate(
      { _id: id, author_id: authorId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
  }

  static async toggleResolve(id: string, userId: string) {
    const comment = await ReviewCommentModel.findOne({ _id: id, deletedAt: null });
    if (!comment) return null;
    const resolved = !comment.resolved;
    const updated = await ReviewCommentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          resolved,
          resolved_by: resolved ? userId : undefined,
          resolved_at: resolved ? new Date() : undefined,
        },
      },
      { new: true }
    );
    return updated ? this.findPublicById(updated._id.toString()) : null;
  }
}
