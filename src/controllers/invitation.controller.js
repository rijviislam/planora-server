const { prisma } = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/invitations  { eventId, invitedEmail }
const createInvitation = asyncHandler(async (req, res) => {
  const { eventId, invitedEmail } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError(404, "Event not found");

  if (event.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Only the event owner can send invitations");
  }

  const invitedUser = await prisma.user.findUnique({ where: { email: invitedEmail } });
  if (!invitedUser) throw new ApiError(404, "No user found with that email");

  const invitation = await prisma.invitation.create({
    data: { eventId, invitedById: req.user.id, invitedId: invitedUser.id },
  });

  res.status(201).json({ success: true, message: "Invitation sent", data: invitation });
});

// GET /api/invitations/mine  (pending invitations for current user)
const getMyInvitations = asyncHandler(async (req, res) => {
  const invitations = await prisma.invitation.findMany({
    where: { invitedId: req.user.id },
    include: {
      event: true,
      invitedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ success: true, data: invitations });
});

// PATCH /api/invitations/:id/decline
const declineInvitation = asyncHandler(async (req, res) => {
  const invitation = await prisma.invitation.findUnique({ where: { id: req.params.id } });
  if (!invitation) throw new ApiError(404, "Invitation not found");
  if (invitation.invitedId !== req.user.id) {
    throw new ApiError(403, "This invitation does not belong to you");
  }

  const updated = await prisma.invitation.update({
    where: { id: req.params.id },
    data: { status: "DECLINED" },
  });

  res.status(200).json({ success: true, message: "Invitation declined", data: updated });
});

// PATCH /api/invitations/:id/accept  (free events only; paid events use payment flow)
const acceptInvitation = asyncHandler(async (req, res) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: req.params.id },
    include: { event: true },
  });
  if (!invitation) throw new ApiError(404, "Invitation not found");
  if (invitation.invitedId !== req.user.id) {
    throw new ApiError(403, "This invitation does not belong to you");
  }

  if (Number(invitation.event.fee) > 0) {
    throw new ApiError(400, "This event requires payment. Use the pay & accept endpoint");
  }

  const [updatedInvitation, participation] = await prisma.$transaction([
    prisma.invitation.update({ where: { id: req.params.id }, data: { status: "ACCEPTED" } }),
    prisma.participation.upsert({
      where: { userId_eventId: { userId: req.user.id, eventId: invitation.eventId } },
      update: { status: "APPROVED" },
      create: { userId: req.user.id, eventId: invitation.eventId, status: "APPROVED" },
    }),
  ]);

  res.status(200).json({
    success: true,
    message: "Invitation accepted",
    data: { invitation: updatedInvitation, participation },
  });
});

module.exports = { createInvitation, getMyInvitations, declineInvitation, acceptInvitation };
