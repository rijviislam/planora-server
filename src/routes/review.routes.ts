import { Router } from "express";
import { body } from "express-validator";
import {
  createReview,
  deleteReview,
  getMyReviews,
  updateReview,
} from "../controllers/review.controller";
import { protect } from "../middleware/auth";
import validate from "../middleware/validate";

const router = Router();

router.post(
  "/",
  protect,
  [
    body("eventId").notEmpty().withMessage("eventId is required"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
  ],
  validate,
  createReview,
);
router.get("/mine", protect, getMyReviews);
router.patch("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

export default router;
