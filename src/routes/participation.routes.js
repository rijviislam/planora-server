const express = require("express");
const {
  joinEvent,
  getEventParticipants,
  approveParticipant,
  rejectParticipant,
  banParticipant,
} = require("../controllers/participation.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/:eventId/join", protect, joinEvent);
router.get("/event/:eventId", protect, getEventParticipants);
router.patch("/:id/approve", protect, approveParticipant);
router.patch("/:id/reject", protect, rejectParticipant);
router.patch("/:id/ban", protect, banParticipant);

module.exports = router;
