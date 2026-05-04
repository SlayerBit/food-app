import { Router } from "express";
import { publicFlowController } from "../controllers/publicFlowController";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(publicFlowController.probe));

export default router;
