import _sinon from "sinon";
import isEmpty from "lodash/fp/isEmpty";
import isArray from "lodash/fp/isArray";

const matchHasDeep = (path, value = null) => {
  const [part, ...restParts] = isArray(path) ? path : path.split(".");
  if (isEmpty(restParts)) {
    return !!value
      ? _sinon.match.has(part, value)
      : _sinon.match.has(part);
  } else {
    return _sinon.match.has(part, matchHasDeep(restParts, value));
  }
};

_sinon.matchHasDeep = matchHasDeep;

export default _sinon;
