import get from "lodash/fp/get";
import isEmpty from "lodash/fp/isEmpty";

const getVerifiedNonce = get("__leServoFilters.jose.verifiedNonce");

export default ({nonceService}) => (req, res, next) => {
  const verifiedNonce = getVerifiedNonce(req);

  if (isEmpty(verifiedNonce)) {
    next();
  } else {
    nonceService.useNonce(verifiedNonce).then(() => {
      next();
    });
  }
};
