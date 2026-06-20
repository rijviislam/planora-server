const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Runs after express-validator chains and throws a 400 with field-level details
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new ApiError(400, "Validation failed", details));
  }
  next();
}

module.exports = validate;
