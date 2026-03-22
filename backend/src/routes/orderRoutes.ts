import { Router } from "express";
import { orderController } from "../controllers/orderController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authenticate, authorize("USER", "ADMIN"), asyncHandler(orderController.place));
router.get("/my", authenticate, authorize("USER", "ADMIN"), asyncHandler(orderController.myOrders));
router.get("/", authenticate, authorize("ADMIN"), asyncHandler(orderController.all));
router.patch("/:id/status", authenticate, authorize("ADMIN"), asyncHandler(orderController.updateStatus));

export default router;
