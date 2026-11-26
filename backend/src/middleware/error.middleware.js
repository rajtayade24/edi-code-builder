export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error.";

  if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body contains invalid JSON.";
  } else if (error?.code === 11000) {
    statusCode = 409;
    message = "A record with these unique details already exists.";
  } else if (error?.name === "ValidationError" || error?.name === "CastError") {
    statusCode = 400;
    message = "One or more submitted values are invalid.";
  } else if (
    error?.name === "MongooseServerSelectionError" ||
    error?.name === "MongoNetworkError" ||
    error?.name === "MongoNotConnectedError"
  ) {
    statusCode = 503;
    message = "Database service is temporarily unavailable.";
  }

  if (statusCode >= 500 && statusCode !== 503) {
    console.error(error);
    message = "An unexpected server error occurred.";
  } else if (statusCode === 503) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { details: error.details } : {}),
  });
}
