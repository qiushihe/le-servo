import isString from "lodash/fp/isString";

export const getJson = (value) => {
  return isString(value) ? JSON.parse(value) : value;
};
