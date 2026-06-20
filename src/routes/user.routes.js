const express = require("express");
const {
  updateProfile,
  getAllUsers,
  deleteUser,
  banUser,
  getAllEventsAdmin,
  deleteEventAdmin,
} = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.patch("/me", protect, updateProfile);

// Admin-only moderation routes
router.get("/", protect, authorize("ADMIN"), getAllUsers);
router.delete("/:id", protect, authorize("ADMIN"), deleteUser);
router.patch("/:id/ban", protect, authorize("ADMIN"), banUser);
router.get("/admin/events", protect, authorize("ADMIN"), getAllEventsAdmin);
router.delete("/admin/events/:id", protect, authorize("ADMIN"), deleteEventAdmin);

module.exports = router;
