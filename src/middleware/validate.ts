import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError";

function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e: any) => ({
      field: e.path ?? e.param,
      message: e.msg,
    }));
    return next(new ApiError(400, "Validation failed", details));
  }
  next();
}

export default validate;
