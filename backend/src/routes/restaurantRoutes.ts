import { Router } from "express";
import { restaurantController } from "../controllers/restaurantController";
import { publicFlowController } from "../controllers/publicFlowController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Public read endpoints (no auth) — register before /:id admin-style routes
router.get("/", asyncHandler(publicFlowController.listRestaurants));
router.get("/:id", asyncHandler(restaurantController.getById));
router.post("/", authenticate, authorize("ADMIN"), asyncHandler(restaurantController.create));
router.put("/:id", authenticate, authorize("ADMIN"), asyncHandler(restaurantController.update));
router.delete("/:id", authenticate, authorize("ADMIN"), asyncHandler(restaurantController.remove));

export default router;
