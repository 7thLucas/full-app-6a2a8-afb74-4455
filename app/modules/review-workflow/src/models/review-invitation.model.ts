import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";
import { User } from "~/modules/authentication/authentication.model";
import { ReviewProject } from "./review-project.model";
import { InvitationStatus } from "../types/invitation-status.types";

@modelOptions({
  schemaOptions: { collection: "tbl_review_invitations", timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
})
export class ReviewInvitation extends CommonTypegooseEntity {
  @prop({ ref: () => ReviewProject, required: true })
  project_id!: Ref<ReviewProject>;

  @prop({ type: String, required: true, lowercase: true })
  email!: string;

  @prop({ type: String, required: true, unique: true })
  token!: string;

  @prop({ type: String, enum: InvitationStatus, default: InvitationStatus.Pending })
  status!: InvitationStatus;

  @prop({ type: Date })
  accepted_at?: Date;

  @prop({ type: Date, required: true })
  expires_at!: Date;

  @prop({ ref: () => User })
  accepted_by?: Ref<User>;
}

export const ReviewInvitationModel = getModelForClass(ReviewInvitation);
export { InvitationStatus };
