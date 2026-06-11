import type { Request, Response } from "express";
import { ProjectFileService } from "../services/project-file.service";
import type { FileMetadata } from "../services/project-file.service";
import { FileType } from "@qb/uploader";

export async function getFiles(req: Request, res: Response): Promise<void> {
  try {
    const files = await ProjectFileService.listByProject(req.params.projectId);
    res.json({ success: true, data: files });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getFileRevisions(req: Request, res: Response): Promise<void> {
  try {
    const revisions = await ProjectFileService.listRevisions(req.params.fileId);
    res.json({ success: true, data: revisions });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function uploadFile(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;
  const { file_url, file_name, file_size_bytes, file_type } = req.body;

  if (!file_url || !file_name || !file_type) {
    res.status(400).json({ success: false, message: "file_url, file_name, and file_type are required" });
    return;
  }

  try {
    const meta: FileMetadata = {
      file_url,
      file_name,
      file_size_bytes: file_size_bytes ? Number(file_size_bytes) : undefined,
      file_type: file_type as FileType,
    };
    const file = await ProjectFileService.createFromUpload({
      projectId,
      uploadedBy: req.user!.id,
      meta,
    });
    res.status(201).json({ success: true, data: file });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function addRevision(req: Request, res: Response): Promise<void> {
  const { fileId } = req.params;
  const { file_url, file_name, file_size_bytes, file_type } = req.body;

  if (!file_url || !file_type) {
    res.status(400).json({ success: false, message: "file_url and file_type are required" });
    return;
  }

  try {
    const existing = await ProjectFileService.findById(fileId);
    if (!existing) { res.status(404).json({ success: false, message: "File not found" }); return; }

    const meta: FileMetadata = {
      file_url,
      file_name: file_name || existing.file_name,
      file_size_bytes: file_size_bytes ? Number(file_size_bytes) : undefined,
      file_type: file_type as FileType,
    };
    const file = await ProjectFileService.addRevision(fileId, {
      projectId: existing.project_id,
      uploadedBy: req.user!.id,
      meta,
    });
    if (!file) { res.status(404).json({ success: false, message: "File not found" }); return; }
    res.status(201).json({ success: true, data: file });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function deleteFile(req: Request, res: Response): Promise<void> {
  try {
    const file = await ProjectFileService.softDelete(req.params.fileId);
    if (!file) { res.status(404).json({ success: false, message: "File not found" }); return; }
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}
