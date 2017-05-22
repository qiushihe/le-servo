import isEmpty from "lodash/fp/isEmpty";
import isArray from "lodash/fp/isArray";
import {match} from "sinon";

export const matchHasDeep = (path, value = null) => {
  const [part, ...restParts] = isArray(path) ? path : path.split(".");
  if (isEmpty(restParts)) {
    return !!value
      ? match.has(part, value)
      : match.has(part);
  } else {
    return match.has(part, matchHasDeep(restParts, value));
  }
};
