import { Router } from "express";
import { authController } from "../controllers/authController";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.post("/signup", asyncHandler(authController.signup));
router.post("/login", asyncHandler(authController.login));

export default router;
