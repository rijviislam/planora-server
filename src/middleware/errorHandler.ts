import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";

function errorHandler(
  err: ApiError & Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = `A record with this ${(err.meta?.target as string[])?.join(", ") || "value"} already exists`;
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

export default errorHandler;
