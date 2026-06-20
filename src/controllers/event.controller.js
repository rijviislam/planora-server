const { prisma } = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/events  (search + filter, only public events for anonymous browsing)
const getEvents = asyncHandler(async (req, res) => {
  const { search, visibility, feeType, page = 1, limit = 9 } = req.query;

  const where = { visibility: "PUBLIC" };

  if (visibility === "PRIVATE") where.visibility = "PRIVATE";

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { owner: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (feeType === "FREE") where.fee = 0;
  if (feeType === "PAID") where.fee = { gt: 0 };

  const skip = (Number(page) - 1) * Number(limit);

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { date: "asc" },
      skip,
      take: Number(limit),
    }),
    prisma.event.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: events,
    meta: { total, page: Number(page), limit: Number(limit) },
  });
});

// GET /api/events/featured
const getFeaturedEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({
    where: { isFeatured: true, visibility: "PUBLIC" },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  });

  res.status(200).json({ success: true, data: event });
});

// GET /api/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      reviews: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { participations: true } },
    },
  });

  if (!event) throw new ApiError(404, "Event not found");

  res.status(200).json({ success: true, data: event });
});

// POST /api/events
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, date, time, venue, visibility, fee } = req.body;

  const event = await prisma.event.create({
    data: {
      title,
      description,
      date: new Date(date),
      time,
      venue,
      visibility: visibility || "PUBLIC",
      fee: fee || 0,
      ownerId: req.user.id,
    },
  });

  res.status(201).json({ success: true, message: "Event created", data: event });
});

// PATCH /api/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw new ApiError(404, "Event not found");

  if (event.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw new ApiError(403, "You can only edit your own events");
  }

  const { title, description, date, time, venue, visibility, fee } = req.body;

  const updated = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(date && { date: new Date(date) }),
      ...(time && { time }),
      ...(venue && { venue }),
      ...(visibility && { visibility }),
      ...(fee !== undefined && { fee }),
    },
  });

  res.status(200).json({ success: true, message: "Event updated", data: updated });
});

// DELETE /api/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw new ApiError(404, "Event not found");

  if (event.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw new ApiError(403, "You can only delete your own events");
  }

  await prisma.event.delete({ where: { id: req.params.id } });

  res.status(200).json({ success: true, message: "Event deleted" });
});

// GET /api/events/mine
const getMyEvents = asyncHandler(async (req, res) => {
  const events = await prisma.event.findMany({
    where: { ownerId: req.user.id },
    orderBy: { date: "asc" },
    include: { _count: { select: { participations: true } } },
  });

  res.status(200).json({ success: true, data: events });
});

module.exports = {
  getEvents,
  getFeaturedEvent,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
};
