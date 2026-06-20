const SSLCommerzPayment = require("sslcommerz-lts");
const { v4: uuidv4 } = require("uuid");
const { prisma } = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

// POST /api/payments/init  { eventId, invitationId? }
// Kicks off SSLCommerz checkout for a paid event (direct join or invitation accept).
const initPayment = asyncHandler(async (req, res) => {
  const { eventId, invitationId } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError(404, "Event not found");
  if (Number(event.fee) <= 0) throw new ApiError(400, "This event does not require payment");

  const transactionId = uuidv4();

  const payment = await prisma.payment.create({
    data: {
      userId: req.user.id,
      eventId: event.id,
      amount: event.fee,
      status: "PENDING",
      transactionId,
    },
  });

  const data = {
    total_amount: Number(event.fee),
    currency: "BDT",
    tran_id: transactionId,
    success_url: `${process.env.SERVER_URL}/api/payments/success/${transactionId}`,
    fail_url: `${process.env.SERVER_URL}/api/payments/fail/${transactionId}`,
    cancel_url: `${process.env.SERVER_URL}/api/payments/cancel/${transactionId}`,
    ipn_url: `${process.env.SERVER_URL}/api/payments/ipn`,
    shipping_method: "NA",
    product_name: event.title,
    product_category: "Event Registration",
    product_profile: "general",
    cus_name: req.user.name,
    cus_email: req.user.email,
    cus_add1: "N/A",
    cus_city: "N/A",
    cus_postcode: "N/A",
    cus_country: "Bangladesh",
    cus_phone: "N/A",
    value_a: invitationId || "",
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  const apiResponse = await sslcz.init(data);

  if (!apiResponse?.GatewayPageURL) {
    throw new ApiError(502, "Failed to initiate payment gateway session");
  }

  res.status(200).json({
    success: true,
    data: { paymentUrl: apiResponse.GatewayPageURL, paymentId: payment.id },
  });
});

// POST /api/payments/success/:tranId  (SSLCommerz redirects here)
const paymentSuccess = asyncHandler(async (req, res) => {
  const { tranId } = req.params;

  const payment = await prisma.payment.findUnique({ where: { transactionId: tranId } });
  if (!payment) throw new ApiError(404, "Payment record not found");

  await prisma.$transaction([
    prisma.payment.update({ where: { transactionId: tranId }, data: { status: "SUCCESS" } }),
    prisma.participation.upsert({
      where: { userId_eventId: { userId: payment.userId, eventId: payment.eventId } },
      update: { status: "PENDING" },
      create: { userId: payment.userId, eventId: payment.eventId, status: "PENDING" },
    }),
  ]);

  res.redirect(`${process.env.CLIENT_URL}/payment/success?tranId=${tranId}`);
});

// POST /api/payments/fail/:tranId
const paymentFail = asyncHandler(async (req, res) => {
  await prisma.payment.update({
    where: { transactionId: req.params.tranId },
    data: { status: "FAILED" },
  });
  res.redirect(`${process.env.CLIENT_URL}/payment/fail?tranId=${req.params.tranId}`);
});

// POST /api/payments/cancel/:tranId
const paymentCancel = asyncHandler(async (req, res) => {
  await prisma.payment.update({
    where: { transactionId: req.params.tranId },
    data: { status: "FAILED" },
  });
  res.redirect(`${process.env.CLIENT_URL}/payment/cancel?tranId=${req.params.tranId}`);
});

// GET /api/payments/mine
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.user.id },
    include: { event: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ success: true, data: payments });
});

module.exports = {
  initPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  getMyPayments,
};
