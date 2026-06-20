const express = require("express");
const { body } = require("express-validator");
const {
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  protect,
  [
    body("eventId").notEmpty().withMessage("eventId is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
  ],
  validate,
  createReview
);
router.get("/mine", protect, getMyReviews);
router.patch("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;
