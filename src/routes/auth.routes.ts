import { Router } from "express";
import { body } from "express-validator";
import { getMe, login, logout, register } from "../controllers/auth.controller";
import { protect } from "../middleware/auth";
import validate from "../middleware/validate";

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register,
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login,
);

router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
