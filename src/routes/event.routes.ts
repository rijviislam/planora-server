import { Router } from "express";
import { body } from "express-validator";
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  getFeaturedEvents,
  getMyEvents,
  updateEvent,
} from "../controllers/event.controller";
import { protect } from "../middleware/auth";
import validate from "../middleware/validate";

const router = Router();

const eventValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("date").isISO8601().withMessage("A valid date is required"),
  body("time").trim().notEmpty().withMessage("Time is required"),
  body("venue").trim().notEmpty().withMessage("Venue is required"),
  body("visibility")
    .optional()
    .isIn(["PUBLIC", "PRIVATE"])
    .withMessage("Visibility must be PUBLIC or PRIVATE"),
  body("fee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fee must be a non-negative number"),
];

router.get("/", getEvents);
router.get("/featured", getFeaturedEvents);
router.get("/mine", protect, getMyEvents);
router.get("/:id", getEventById);
router.post("/", protect, eventValidation, validate, createEvent);
router.patch("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

export default router;
