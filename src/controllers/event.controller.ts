import { Request, Response } from "express";
import { prisma } from "../config/db";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";

const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const visibility = req.query.visibility as string | undefined;
  const feeType = req.query.feeType as string | undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 9;

  const where: any = { visibility: "PUBLIC" };

  if (visibility === "PRIVATE") where.visibility = "PRIVATE";

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { owner: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (feeType === "FREE") where.fee = 0;
  if (feeType === "PAID") where.fee = { gt: 0 };

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { date: "asc" },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: events,
    meta: { total, page, limit },
  });
});

const getFeaturedEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    where: { isFeatured: true, visibility: "PUBLIC" },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
    take: 6,
  });

  res.status(200).json({ success: true, data: events });
});

const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      reviews: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { participations: true } },
    },
  });

  if (!event) throw new ApiError(404, "Event not found");

  res.status(200).json({ success: true, data: event });
});

const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, date, time, venue, fee } = req.body;
  const visibility = req.body.visibility as "PUBLIC" | "PRIVATE" | undefined;

  const event = await prisma.event.create({
    data: {
      title,
      description,
      date: new Date(date),
      time,
      venue,
      visibility: visibility || "PUBLIC",
      fee: fee || 0,
      ownerId: req.user!.id,
    },
  });

  res
    .status(201)
    .json({ success: true, message: "Event created", data: event });
});

const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new ApiError(404, "Event not found");

  if (event.ownerId !== req.user!.id && req.user!.role !== "ADMIN") {
    throw new ApiError(403, "You can only edit your own events");
  }

  const { title, description, date, time, venue, fee } = req.body;
  const visibility = req.body.visibility as "PUBLIC" | "PRIVATE" | undefined;

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(date && { date: new Date(date) }),
      ...(time && { time }),
      ...(venue && { venue }),
      ...(visibility && { visibility: visibility as "PUBLIC" | "PRIVATE" }),
      ...(fee !== undefined && { fee }),
    },
  });

  res
    .status(200)
    .json({ success: true, message: "Event updated", data: updated });
});

const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new ApiError(404, "Event not found");

  if (event.ownerId !== req.user!.id && req.user!.role !== "ADMIN") {
    throw new ApiError(403, "You can only delete your own events");
  }

  await prisma.event.delete({ where: { id } });

  res.status(200).json({ success: true, message: "Event deleted" });
});

const getMyEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { date: "asc" },
    include: { _count: { select: { participations: true } } },
  });

  res.status(200).json({ success: true, data: events });
});

export {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  getFeaturedEvents,
  getMyEvents,
  updateEvent,
};
