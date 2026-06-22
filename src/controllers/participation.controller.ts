import { Request, Response } from "express";
import { prisma } from "../config/db";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";

const joinEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.eventId as string;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError(404, "Event not found");

  if (Number(event.fee) > 0)
    throw new ApiError(
      400,
      "This event requires payment. Use the pay & join endpoint",
    );

  const existing = await prisma.participation.findUnique({
    where: { userId_eventId: { userId: req.user!.id, eventId: event.id } },
  });
  if (existing)
    throw new ApiError(
      409,
      "You already have a participation request for this event",
    );

  const status = event.visibility === "PUBLIC" ? "APPROVED" : "PENDING";
  const participation = await prisma.participation.create({
    data: { userId: req.user!.id, eventId: event.id, status },
  });

  res.status(201).json({
    success: true,
    message:
      status === "APPROVED"
        ? "Joined event successfully"
        : "Join request sent, pending approval",
    data: participation,
  });
});

const getEventParticipants = asyncHandler(
  async (req: Request, res: Response) => {
    const eventId = req.params.eventId as string;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, "Event not found");

    if (event.ownerId !== req.user!.id && req.user!.role !== "ADMIN")
      throw new ApiError(403, "Only the event owner can view participants");

    const participants = await prisma.participation.findMany({
      where: { eventId: event.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: participants });
  },
);

const approveParticipant = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const participation = await prisma.participation.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!participation)
    throw new ApiError(404, "Participation request not found");

  if (
    participation.event.ownerId !== req.user!.id &&
    req.user!.role !== "ADMIN"
  )
    throw new ApiError(403, "Only the event owner can approve participants");

  const updated = await prisma.participation.update({
    where: { id },
    data: { status: "APPROVED" },
  });
  res
    .status(200)
    .json({ success: true, message: "Participant approved", data: updated });
});

const rejectParticipant = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const participation = await prisma.participation.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!participation)
    throw new ApiError(404, "Participation request not found");

  if (
    participation.event.ownerId !== req.user!.id &&
    req.user!.role !== "ADMIN"
  )
    throw new ApiError(403, "Only the event owner can reject participants");

  const updated = await prisma.participation.update({
    where: { id },
    data: { status: "REJECTED" },
  });
  res
    .status(200)
    .json({ success: true, message: "Participant rejected", data: updated });
});

const banParticipant = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const participation = await prisma.participation.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!participation)
    throw new ApiError(404, "Participation request not found");

  if (
    participation.event.ownerId !== req.user!.id &&
    req.user!.role !== "ADMIN"
  )
    throw new ApiError(403, "Only the event owner can ban participants");

  const updated = await prisma.participation.update({
    where: { id },
    data: { status: "BANNED" },
  });
  res
    .status(200)
    .json({ success: true, message: "Participant banned", data: updated });
});

export {
  approveParticipant,
  banParticipant,
  getEventParticipants,
  joinEvent,
  rejectParticipant,
};
