import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config/db";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
const SSLCommerzPayment = require("sslcommerz-lts");

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

const initPayment = asyncHandler(async (req: Request, res: Response) => {
  const { eventId, invitationId } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError(404, "Event not found");
  if (Number(event.fee) <= 0)
    throw new ApiError(400, "This event does not require payment");

  const transactionId = uuidv4();

  const payment = await prisma.payment.create({
    data: {
      userId: req.user!.id,
      eventId: event.id,
      amount: event.fee,
      status: "PENDING",
      transactionId,
    },
  });

  const user = req.user!;
  const data = {
    total_amount: Number(event.fee),
    currency: "BDT",
    tran_id: transactionId,
    success_url: `${process.env.SERVER_URL}/api/payments/success/${transactionId}`,
    fail_url: `${process.env.SERVER_URL}/api/payments/fail/${transactionId}`,
    cancel_url: `${process.env.SERVER_URL}/api/payments/cancel/${transactionId}`,
    ipn_url: `${process.env.SERVER_URL}/api/payments/ipn`,
    shipping_method: "NO",
    product_name: event.title,
    product_category: "Event Registration",
    product_profile: "non-physical-goods",
    cus_name: user.name,
    cus_email: user.email,
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_postcode: "1212",
    cus_country: "Bangladesh",
    cus_phone: (user as any).phone || "01711111111",
    ship_name: user.name,
    ship_add1: "Dhaka",
    ship_city: "Dhaka",
    ship_postcode: "1212",
    ship_country: "Bangladesh",
    value_a: invitationId || "",
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  const apiResponse = await sslcz.init(data);

  if (!apiResponse?.GatewayPageURL) {
    throw new ApiError(
      502,
      "Failed to initiate payment gateway session",
      process.env.NODE_ENV !== "production"
        ? { sslcommerzResponse: apiResponse }
        : null,
    );
  }

  res.status(200).json({
    success: true,
    data: { paymentUrl: apiResponse.GatewayPageURL, paymentId: payment.id },
  });
});

const paymentSuccess = asyncHandler(async (req: Request, res: Response) => {
  const tranId = req.params.tranId as string;
  const invitationId = req.body?.value_a || null;

  const payment = await prisma.payment.findUnique({
    where: { transactionId: tranId },
  });
  if (!payment) throw new ApiError(404, "Payment record not found");

  const operations: any[] = [
    prisma.payment.update({
      where: { transactionId: tranId },
      data: { status: "SUCCESS" },
    }),
    prisma.participation.upsert({
      where: {
        userId_eventId: { userId: payment.userId, eventId: payment.eventId },
      },
      update: { status: "PENDING" },
      create: {
        userId: payment.userId,
        eventId: payment.eventId,
        status: "PENDING",
      },
    }),
  ];

  if (invitationId) {
    operations.push(
      prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      }),
    );
  }

  await prisma.$transaction(operations);
  res.redirect(`${process.env.CLIENT_URL}/payment/success?tranId=${tranId}`);
});

const paymentFail = asyncHandler(async (req: Request, res: Response) => {
  const tranId = req.params.tranId as string;
  await prisma.payment.update({
    where: { transactionId: tranId },
    data: { status: "FAILED" },
  });
  res.redirect(`${process.env.CLIENT_URL}/payment/fail?tranId=${tranId}`);
});

const paymentCancel = asyncHandler(async (req: Request, res: Response) => {
  const tranId = req.params.tranId as string;
  await prisma.payment.update({
    where: { transactionId: tranId },
    data: { status: "FAILED" },
  });
  res.redirect(`${process.env.CLIENT_URL}/payment/cancel?tranId=${tranId}`);
});

const getMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.user!.id },
    include: { event: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ success: true, data: payments });
});

export {
  getMyPayments,
  initPayment,
  paymentCancel,
  paymentFail,
  paymentSuccess,
};
