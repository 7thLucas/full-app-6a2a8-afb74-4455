import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";
import { User } from "~/modules/authentication/authentication.model";
import { FileType } from "@qb/uploader";

@modelOptions({
  schemaOptions: { collection: "tbl_project_files", timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
})
export class ProjectFile extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  project_id!: string;

  @prop({ type: String, required: true })
  file_url!: string;

  @prop({ type: String, required: true })
  file_name!: string;

  @prop({ type: Number })
  file_size_bytes?: number;

  @prop({ type: String, enum: FileType, required: true })
  file_type!: FileType;

  @prop({ ref: () => User, required: true })
  uploaded_by!: Ref<User>;

  // Revision tracking — v1 has no root_file_id, v2+ links back to the v1 _id
  @prop({ type: String })
  root_file_id?: string;

  @prop({ type: Number, default: 1 })
  revision!: number;

  // Only the latest revision of a file chain is shown in the grid
  @prop({ type: Boolean, default: true })
  is_current!: boolean;
}

export const ProjectFileModel = getModelForClass(ProjectFile);
