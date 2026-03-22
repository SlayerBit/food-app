import { Router } from "express";
import authRoutes from "./authRoutes";
import restaurantRoutes from "./restaurantRoutes";
import menuRoutes from "./menuRoutes";
import cartRoutes from "./cartRoutes";
import orderRoutes from "./orderRoutes";
import userRoutes from "./userRoutes";

const router = Router();

// Public: /auth/* — no authenticate middleware on these routers
router.use("/auth", authRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/menu", menuRoutes);

// Protected: authenticate is applied per-route inside these routers only
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);

export default router;
