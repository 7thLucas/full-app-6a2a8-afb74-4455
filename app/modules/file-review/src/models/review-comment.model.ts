import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";
import { User } from "~/modules/authentication/authentication.model";
import { ProjectFile } from "./project-file.model";

export { CommentType } from "../types/comment.types";
import { CommentType } from "../types/comment.types";

@modelOptions({
  schemaOptions: { collection: "tbl_review_comments", timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
})
export class ReviewComment extends CommonTypegooseEntity {
  @prop({ ref: () => ProjectFile, required: true })
  project_file_id!: Ref<ProjectFile>;

  @prop({ type: String, required: true, minlength: 1 })
  content!: string;

  @prop({ ref: () => User, required: true })
  author_id!: Ref<User>;

  @prop({ type: String, enum: CommentType, default: CommentType.Text })
  comment_type!: CommentType;

  // Pin / region coords (image / PDF)
  @prop({ type: Number })
  page?: number;

  @prop({ type: Number })
  x?: number;

  @prop({ type: Number })
  y?: number;

  @prop({ type: Number })
  width?: number;

  @prop({ type: Number })
  height?: number;

  @prop({ type: Number })
  pin_number?: number;

  // Video timestamp (seconds)
  @prop({ type: Number })
  timestamp_seconds?: number;

  // Thread
  @prop({ ref: () => ReviewComment })
  parent_id?: Ref<ReviewComment>;

  @prop({ type: Boolean, default: false })
  resolved!: boolean;

  @prop({ ref: () => User })
  resolved_by?: Ref<User>;

  @prop({ type: Date })
  resolved_at?: Date;
}

export const ReviewCommentModel = getModelForClass(ReviewComment);
