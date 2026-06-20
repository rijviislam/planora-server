const { prisma } = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// PATCH /api/users/me  (update own profile)
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { ...(name && { name }) },
  });

  res.status(200).json({
    success: true,
    message: "Profile updated",
    data: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
  });
});

// --- Admin-only ---

// GET /api/users  (admin: list/monitor all users)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ success: true, data: users });
});

// DELETE /api/users/:id  (admin: delete a user account)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new ApiError(404, "User not found");

  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: "User account deleted" });
});

// PATCH /api/users/:id/ban  (admin: ban a user account)
const banUser = asyncHandler(async (req, res) => {
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBanned: true },
  });
  res.status(200).json({ success: true, message: "User banned", data: { id: updated.id } });
});

// GET /api/users/admin/events  (admin: monitor all events across the platform)
const getAllEventsAdmin = asyncHandler(async (req, res) => {
  const events = await prisma.event.findMany({
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ success: true, data: events });
});

// DELETE /api/users/admin/events/:id  (admin: remove inappropriate event)
const deleteEventAdmin = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw new ApiError(404, "Event not found");

  await prisma.event.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: "Event removed by admin" });
});

module.exports = {
  updateProfile,
  getAllUsers,
  deleteUser,
  banUser,
  getAllEventsAdmin,
  deleteEventAdmin,
};
