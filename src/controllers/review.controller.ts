import { Request, Response } from "express";
import { prisma } from "../config/db";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";

const REVIEW_EDIT_WINDOW_DAYS = 7;

function withinEditWindow(createdAt: Date): boolean {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return diffMs <= REVIEW_EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { eventId, rating, comment } = req.body;

  const participation = await prisma.participation.findUnique({
    where: { userId_eventId: { userId: req.user!.id, eventId } },
  });
  if (!participation || participation.status !== "APPROVED")
    throw new ApiError(403, "Only approved participants can review this event");

  const review = await prisma.review.create({
    data: { eventId, userId: req.user!.id, rating, comment },
  });

  res
    .status(201)
    .json({ success: true, message: "Review submitted", data: review });
});

const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { userId: req.user!.id },
    include: { event: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ success: true, data: reviews });
});

const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new ApiError(404, "Review not found");
  if (review.userId !== req.user!.id)
    throw new ApiError(403, "You can only edit your own reviews");
  if (!withinEditWindow(review.createdAt))
    throw new ApiError(
      400,
      "This review can no longer be edited (edit window has passed)",
    );

  const { rating, comment } = req.body;
  const updated = await prisma.review.update({
    where: { id },
    data: { ...(rating && { rating }), ...(comment && { comment }) },
  });

  res
    .status(200)
    .json({ success: true, message: "Review updated", data: updated });
});

const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new ApiError(404, "Review not found");
  if (review.userId !== req.user!.id && req.user!.role !== "ADMIN")
    throw new ApiError(403, "You can only delete your own reviews");
  if (req.user!.role !== "ADMIN" && !withinEditWindow(review.createdAt))
    throw new ApiError(
      400,
      "This review can no longer be deleted (edit window has passed)",
    );

  await prisma.review.delete({ where: { id } });
  res.status(200).json({ success: true, message: "Review deleted" });
});

export { createReview, deleteReview, getMyReviews, updateReview };
