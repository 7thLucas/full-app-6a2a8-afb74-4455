import { Router } from "express";
import { startLogin, callback, unlink } from "./google_authentication.controller";
import { requireAuth } from "~/modules/authentication/authentication.middleware";

const router = Router();

router.get("/google-auth/login", startLogin);
router.get("/google-auth/callback", callback);
router.post("/google-auth/unlink", requireAuth, unlink);

export default router;
