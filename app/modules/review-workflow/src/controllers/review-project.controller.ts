import type { Request, Response } from "express";
import { ReviewProjectService } from "../services/review-project.service";
import { ReviewProjectModel, ProjectStatus, STATUS_TRANSITIONS, STATUS_ACTOR } from "../models/review-project.model";
import { UserRole } from "~/modules/authentication/authentication.types";

export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    const projects = await ReviewProjectService.listForUser(req.user!.id, req.user!.role);
    res.json({ success: true, data: projects });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await ReviewProjectService.findById(req.params.projectId);
    if (!project) { res.status(404).json({ success: false, message: "Not found" }); return; }
    if (!ReviewProjectService.canAccess(project, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    res.json({ success: true, data: project });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await ReviewProjectService.create({ ...req.body, agency_id: req.user!.id });
    res.status(201).json({ success: true, data: project });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    if (!await ReviewProjectService.canManageProject(req.params.projectId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    const project = await ReviewProjectService.update(req.params.projectId, req.body);
    if (!project) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: project });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    if (!await ReviewProjectService.canManageProject(req.params.projectId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    const project = await ReviewProjectModel.findOneAndUpdate(
      { _id: req.params.projectId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!project) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function searchClients(req: Request, res: Response): Promise<void> {
  try {
    if (!await ReviewProjectService.canManageProject(req.params.projectId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    const query = (req.query.q as string) ?? "";
    const project = await ReviewProjectModel.findById(req.params.projectId).select("client_ids");
    const excludeIds = (project?.client_ids ?? []).map((id: any) => id.toString());
    const clients = await ReviewProjectService.searchClients(query, excludeIds);
    res.json({ success: true, data: clients });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function addClientDirect(req: Request, res: Response): Promise<void> {
  try {
    if (!await ReviewProjectService.canManageProject(req.params.projectId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    const { userId } = req.body;
    if (!userId) { res.status(400).json({ success: false, message: "userId required" }); return; }
    const project = await ReviewProjectService.addClient(req.params.projectId, userId);
    res.json({ success: true, data: project });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function removeClient(req: Request, res: Response): Promise<void> {
  try {
    if (!await ReviewProjectService.canManageProject(req.params.projectId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    const project = await ReviewProjectService.removeClient(req.params.projectId, req.params.userId);
    res.json({ success: true, data: project });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
}

export async function transitionProjectStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body;
    if (!status || !Object.values(ProjectStatus).includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status" });
      return;
    }

    const toStatus = status as ProjectStatus;
    const actorRole = STATUS_ACTOR[toStatus];
    const userRole = req.user!.role;

    const isAgency = userRole === UserRole.Agency || userRole === "admin";
    const isClient = userRole === UserRole.Client;

    if (actorRole === "agency" && !isAgency) {
      res.status(403).json({ success: false, message: "Only the agency can perform this action" });
      return;
    }
    if (actorRole === "client" && !isClient) {
      res.status(403).json({ success: false, message: "Only the client can perform this action" });
      return;
    }
    if (actorRole === "agency" && !await ReviewProjectService.canManageProject(req.params.projectId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    if (actorRole === "client" && !await ReviewProjectService.canAccessProject(req.params.projectId, req.user!)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    const project = await ReviewProjectService.transitionStatus(req.params.projectId, toStatus);
    if (!project) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: project });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
}
