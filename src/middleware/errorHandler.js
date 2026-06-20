const { Prisma } = require("@prisma/client");

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  // Prisma known request errors (e.g. unique constraint, foreign key)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = `A record with this ${err.meta?.target?.join(", ") || "value"} already exists`;
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Requested record was not found";
    } else if (err.code === "P2003") {
      statusCode = 400;
      message = "Invalid reference to a related record";
    } else {
      statusCode = 400;
      message = "Database request error";
    }
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
  });
}

module.exports = errorHandler;
