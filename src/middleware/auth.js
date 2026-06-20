const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const { prisma } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

// Verifies the JWT and attaches the current user to req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    throw new ApiError(401, "Not authorized, user no longer exists");
  }
  if (user.isBanned) {
    throw new ApiError(403, "Your account has been banned");
  }

  req.user = user;
  next();
});

// Restricts access to specific roles, e.g. authorize("ADMIN")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
  next();
};

module.exports = { protect, authorize };
