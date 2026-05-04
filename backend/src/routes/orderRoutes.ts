import { Router } from "express";
import { orderController } from "../controllers/orderController";
import { publicFlowController } from "../controllers/publicFlowController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Public traffic APIs (no auth).
router.get("/sample", asyncHandler(publicFlowController.sampleOrders));
router.post("/simulate", asyncHandler(publicFlowController.simulateOrder));

router.post("/", authenticate, authorize("USER", "ADMIN"), asyncHandler(orderController.place));
router.get("/my", authenticate, authorize("USER", "ADMIN"), asyncHandler(orderController.myOrders));
router.get("/", authenticate, authorize("ADMIN"), asyncHandler(orderController.all));
router.patch("/:id/status", authenticate, authorize("ADMIN"), asyncHandler(orderController.updateStatus));

export default router;
