const { prisma } = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/participations/:eventId/join
// Handles Free Public (instant join) and Private Free (request to join).
// Paid events must go through the payment flow instead (see payment.controller).
const joinEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
  if (!event) throw new ApiError(404, "Event not found");

  if (Number(event.fee) > 0) {
    throw new ApiError(400, "This event requires payment. Use the pay & join endpoint");
  }

  const existing = await prisma.participation.findUnique({
    where: { userId_eventId: { userId: req.user.id, eventId: event.id } },
  });
  if (existing) throw new ApiError(409, "You already have a participation request for this event");

  const status = event.visibility === "PUBLIC" ? "APPROVED" : "PENDING";

  const participation = await prisma.participation.create({
    data: { userId: req.user.id, eventId: event.id, status },
  });

  res.status(201).json({
    success: true,
    message: status === "APPROVED" ? "Joined event successfully" : "Join request sent, pending approval",
    data: participation,
  });
});

// GET /api/participations/event/:eventId  (owner views participants)
const getEventParticipants = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
  if (!event) throw new ApiError(404, "Event not found");

  if (event.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Only the event owner can view participants");
  }

  const participants = await prisma.participation.findMany({
    where: { eventId: event.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ success: true, data: participants });
});

// PATCH /api/participations/:id/approve
const approveParticipant = asyncHandler(async (req, res) => {
  const participation = await prisma.participation.findUnique({
    where: { id: req.params.id },
    include: { event: true },
  });
  if (!participation) throw new ApiError(404, "Participation request not found");

  if (participation.event.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Only the event owner can approve participants");
  }

  const updated = await prisma.participation.update({
    where: { id: req.params.id },
    data: { status: "APPROVED" },
  });

  res.status(200).json({ success: true, message: "Participant approved", data: updated });
});

// PATCH /api/participations/:id/reject
const rejectParticipant = asyncHandler(async (req, res) => {
  const participation = await prisma.participation.findUnique({
    where: { id: req.params.id },
    include: { event: true },
  });
  if (!participation) throw new ApiError(404, "Participation request not found");

  if (participation.event.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Only the event owner can reject participants");
  }

  const updated = await prisma.participation.update({
    where: { id: req.params.id },
    data: { status: "REJECTED" },
  });

  res.status(200).json({ success: true, message: "Participant rejected", data: updated });
});

// PATCH /api/participations/:id/ban
const banParticipant = asyncHandler(async (req, res) => {
  const participation = await prisma.participation.findUnique({
    where: { id: req.params.id },
    include: { event: true },
  });
  if (!participation) throw new ApiError(404, "Participation request not found");

  if (participation.event.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Only the event owner can ban participants");
  }

  const updated = await prisma.participation.update({
    where: { id: req.params.id },
    data: { status: "BANNED" },
  });

  res.status(200).json({ success: true, message: "Participant banned", data: updated });
});

module.exports = {
  joinEvent,
  getEventParticipants,
  approveParticipant,
  rejectParticipant,
  banParticipant,
};
