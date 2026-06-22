import { Router } from "express";
import { body } from "express-validator";
import {
  acceptInvitation,
  createInvitation,
  declineInvitation,
  getMyInvitations,
} from "../controllers/invitation.controller";
import { protect } from "../middleware/auth";
import validate from "../middleware/validate";

const router = Router();

router.post(
  "/",
  protect,
  [
    body("eventId").notEmpty().withMessage("eventId is required"),
    body("invitedEmail")
      .isEmail()
      .withMessage("A valid invitee email is required"),
  ],
  validate,
  createInvitation,
);
router.get("/mine", protect, getMyInvitations);
router.patch("/:id/decline", protect, declineInvitation);
router.patch("/:id/accept", protect, acceptInvitation);

export default router;
