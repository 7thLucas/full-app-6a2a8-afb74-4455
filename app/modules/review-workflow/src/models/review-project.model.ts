import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";
import { User } from "~/modules/authentication/authentication.model";

export enum ProjectStatus {
  Draft = "draft",
  InReview = "in_review",
  InRevision = "in_revision",
  Approved = "approved",
}

// Allowed transitions: [fromStatus] → allowedNextStatuses
export const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.Draft]:      [ProjectStatus.InReview],
  [ProjectStatus.InReview]:   [ProjectStatus.InRevision, ProjectStatus.Approved],
  [ProjectStatus.InRevision]: [ProjectStatus.InReview],
  [ProjectStatus.Approved]:   [],
};

// Which role can trigger each transition (destination status → actor)
export const STATUS_ACTOR: Record<ProjectStatus, "agency" | "client"> = {
  [ProjectStatus.Draft]:      "agency",
  [ProjectStatus.InReview]:   "agency",
  [ProjectStatus.InRevision]: "client",
  [ProjectStatus.Approved]:   "client",
};

@modelOptions({
  schemaOptions: { collection: "tbl_review_projects", timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
})
export class ReviewProject extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  title!: string;

  @prop({ type: String })
  description?: string;

  @prop({ ref: () => User, required: true })
  agency_id!: Ref<User>;

  @prop({ ref: () => User, type: () => [Object], default: [] })
  client_ids!: Ref<User>[];

  @prop({ type: String, enum: ProjectStatus, default: ProjectStatus.Draft })
  status!: ProjectStatus;

  @prop({ type: Number, default: 1 })
  round!: number;

  @prop({ type: Date })
  deadline?: Date;
}

export const ReviewProjectModel = getModelForClass(ReviewProject);
