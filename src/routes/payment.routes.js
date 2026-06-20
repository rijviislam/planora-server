const express = require("express");
const {
  initPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  getMyPayments,
} = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/init", protect, initPayment);
router.get("/mine", protect, getMyPayments);

// SSLCommerz calls these directly (server-to-server / browser redirect), no auth header present
router.post("/success/:tranId", paymentSuccess);
router.post("/fail/:tranId", paymentFail);
router.post("/cancel/:tranId", paymentCancel);

module.exports = router;
