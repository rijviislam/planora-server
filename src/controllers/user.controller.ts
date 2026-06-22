import { Request, Response } from "express";
import { prisma } from "../config/db";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";

const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { ...(name && { name }) },
  });

  res.status(200).json({
    success: true,
    message: "Profile updated",
    data: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    },
  });
});

const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ success: true, data: users });
});

const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");

  await prisma.user.delete({ where: { id } });
  res.status(200).json({ success: true, message: "User account deleted" });
});

const banUser = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updated = await prisma.user.update({
    where: { id },
    data: { isBanned: true },
  });
  res
    .status(200)
    .json({ success: true, message: "User banned", data: { id: updated.id } });
});

const getAllEventsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ success: true, data: events });
});

const deleteEventAdmin = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new ApiError(404, "Event not found");

  await prisma.event.delete({ where: { id } });
  res.status(200).json({ success: true, message: "Event removed by admin" });
});

const toggleFeatureEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new ApiError(404, "Event not found");

  const updated = await prisma.event.update({
    where: { id },
    data: { isFeatured: !event.isFeatured },
  });

  res.status(200).json({
    success: true,
    message: updated.isFeatured
      ? "Event marked as featured"
      : "Event removed from featured",
    data: { id: updated.id, isFeatured: updated.isFeatured },
  });
});

export {
  banUser,
  deleteEventAdmin,
  deleteUser,
  getAllEventsAdmin,
  getAllUsers,
  toggleFeatureEvent,
  updateProfile,
};
