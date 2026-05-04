import { Router } from "express";
import { menuController } from "../controllers/menuController";
import { publicFlowController } from "../controllers/publicFlowController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Public browsable menu feed for traffic generation.
router.get("/", asyncHandler(publicFlowController.listMenu));
// Public menu read — explicit path so it never competes with protected routes
router.get("/:restaurantId", asyncHandler(menuController.listByRestaurant));
router.post("/", authenticate, authorize("ADMIN"), asyncHandler(menuController.create));
router.put("/:id", authenticate, authorize("ADMIN"), asyncHandler(menuController.update));
router.delete("/:id", authenticate, authorize("ADMIN"), asyncHandler(menuController.remove));

export default router;
