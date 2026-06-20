const express = require("express");
const { body } = require("express-validator");
const {
  createInvitation,
  getMyInvitations,
  declineInvitation,
  acceptInvitation,
} = require("../controllers/invitation.controller");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  protect,
  [
    body("eventId").notEmpty().withMessage("eventId is required"),
    body("invitedEmail").isEmail().withMessage("A valid invitee email is required"),
  ],
  validate,
  createInvitation
);
router.get("/mine", protect, getMyInvitations);
router.patch("/:id/decline", protect, declineInvitation);
router.patch("/:id/accept", protect, acceptInvitation);

module.exports = router;
