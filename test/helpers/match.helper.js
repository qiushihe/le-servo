import isEmpty from "lodash/fp/isEmpty";
import isArray from "lodash/fp/isArray";

export const matchHasDeep = (path, value = null) => {
  const [part, ...restParts] = isArray(path) ? path : path.split(".");
  if (isEmpty(restParts)) {
    return !!value
      ? sinon.match.has(part, value)
      : sinon.match.has(part);
  } else {
    return sinon.match.has(part, matchHasDeep(restParts, value));
  }
};
