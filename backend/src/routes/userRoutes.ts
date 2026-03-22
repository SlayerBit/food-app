import { Router } from "express";
import { userController } from "../controllers/userController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", authenticate, asyncHandler(userController.me));
router.put("/me", authenticate, asyncHandler(userController.updateMe));
router.post("/address", authenticate, asyncHandler(userController.addAddress));
router.delete("/address/:id", authenticate, asyncHandler(userController.deleteAddress));

export default router;

