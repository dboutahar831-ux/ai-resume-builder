class AppError extends Error {
  constructor(message, statusCode, expose = true) {
    super(message);
    this.statusCode = statusCode;
    this.expose = expose;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized.') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden.') {
    super(message, 403);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Invalid input.') {
    super(message, 400);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists.') {
    super(message, 409);
  }
}

module.exports = { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError };
