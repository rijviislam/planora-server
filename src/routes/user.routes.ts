import { Router } from "express";
import {
  banUser,
  deleteEventAdmin,
  deleteUser,
  getAllEventsAdmin,
  getAllUsers,
  toggleFeatureEvent,
  updateProfile,
} from "../controllers/user.controller";
import { authorize, protect } from "../middleware/auth";

const router = Router();

router.patch("/me", protect, updateProfile);
router.get("/", protect, authorize("ADMIN"), getAllUsers);
router.delete("/:id", protect, authorize("ADMIN"), deleteUser);
router.patch("/:id/ban", protect, authorize("ADMIN"), banUser);
router.get("/admin/events", protect, authorize("ADMIN"), getAllEventsAdmin);
router.delete(
  "/admin/events/:id",
  protect,
  authorize("ADMIN"),
  deleteEventAdmin,
);
router.patch(
  "/admin/events/:id/feature",
  protect,
  authorize("ADMIN"),
  toggleFeatureEvent,
);

export default router;
