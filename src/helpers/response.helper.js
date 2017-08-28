import {
  TYPE_BAD_REQUEST,
  TYPE_UNAUTHORIZED,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND,
  TYPE_PRECONDITION_FAILED,
  TYPE_UNPROCESSABLE_ENTITY
} from "src/helpers/error.helper";

export const STATUS_MAP = {
  [TYPE_BAD_REQUEST]: 400,
  [TYPE_UNAUTHORIZED]: 401,
  [TYPE_FORBIDDEN]: 403,
  [TYPE_NOT_FOUND]: 404,
  [TYPE_PRECONDITION_FAILED]: 412,
  [TYPE_UNPROCESSABLE_ENTITY]: 422
};

export const runtimeErrorResponse = (res) => (err = "") => {
  const {message, type} = err;
  const errorMessage = message || err || "Unknown Error";
  console.error(err);
  res.status(STATUS_MAP[type] || 500).send(errorMessage).end();
};
