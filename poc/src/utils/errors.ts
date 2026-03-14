export class ValidationError extends Error {
  readonly statusCode = 400;
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
}
