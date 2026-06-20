const express = require("express");
const { body } = require("express-validator");
const {
  getEvents,
  getFeaturedEvent,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
} = require("../controllers/event.controller");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

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
router.get("/featured", getFeaturedEvent);
router.get("/mine", protect, getMyEvents);
router.get("/:id", getEventById);

router.post("/", protect, eventValidation, validate, createEvent);
router.patch("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

module.exports = router;
