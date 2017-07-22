/* 400 */ export const TYPE_BAD_REQUEST = "Bad Request";
/* 401 */ export const TYPE_UNAUTHORIZED = "Unauthorized";
/* 403 */ export const TYPE_FORBIDDEN = "Forbidden";
/* 404 */ export const TYPE_NOT_FOUND = "Not Found";
/* 412 */ export const TYPE_PRECONDITION_FAILED = "Precondition Failed";
/* 422 */ export const TYPE_UNPROCESSABLE_ENTITY = "Unprocessable Entity";

export class RuntimeError extends Error {
  constructor({message, type}, ...rest) {
    super(message, ...rest);
    this.message = message;
    this.type = type;
  }
}
