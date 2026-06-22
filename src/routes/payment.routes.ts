import { Router } from "express";
import {
  getMyPayments,
  initPayment,
  paymentCancel,
  paymentFail,
  paymentSuccess,
} from "../controllers/payment.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/init", protect, initPayment);
router.get("/mine", protect, getMyPayments);
router.post("/success/:tranId", paymentSuccess);
router.post("/fail/:tranId", paymentFail);
router.post("/cancel/:tranId", paymentCancel);

export default router;
