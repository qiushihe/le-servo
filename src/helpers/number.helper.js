import isNumber from "lodash/fp/isNumber";
import isFinite from "lodash/fp/isFinite";

export const isFiniteNumber = (value) => (isNumber(value) && isFinite(value));

export const isPositiveNumber = (value) => (isFiniteNumber(value) && value > 0);
