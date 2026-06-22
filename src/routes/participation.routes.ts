import { Router } from "express";
import {
  approveParticipant,
  banParticipant,
  getEventParticipants,
  joinEvent,
  rejectParticipant,
} from "../controllers/participation.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/:eventId/join", protect, joinEvent);
router.get("/event/:eventId", protect, getEventParticipants);
router.patch("/:id/approve", protect, approveParticipant);
router.patch("/:id/reject", protect, rejectParticipant);
router.patch("/:id/ban", protect, banParticipant);

export default router;
