import {
  TYPE_UNAUTHORIZED,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND,
  TYPE_PRECONDITION_FAILED,
  TYPE_UNPROCESSABLE_ENTITY
} from "src/helpers/error.helper";

export const STATUS_MAP = {
  [TYPE_UNAUTHORIZED]: 401,
  [TYPE_FORBIDDEN]: 403,
  [TYPE_NOT_FOUND]: 404,
  [TYPE_PRECONDITION_FAILED]: 412,
  [TYPE_UNPROCESSABLE_ENTITY]: 422
};

export const runtimeErrorResponse = (res) => ({message, type}) => {
  res.status(STATUS_MAP[type] || 500).send(message).end();
};
