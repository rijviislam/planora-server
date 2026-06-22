import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";

function notFound(req: Request, res: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

export default notFound;
