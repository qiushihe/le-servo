import get from "lodash/fp/get";
import isEmpty from "lodash/fp/isEmpty";

import NonceService from "services/nonce.service";

const getVerifiedNonce = get("__leServoFilters.jose.verifiedNonce");

export default (req, res, next) => {
  const verifiedNonce = getVerifiedNonce(req);
  if (!isEmpty(verifiedNonce)) {
    NonceService.GetDefaultInstance().useNonce(verifiedNonce).then(() => {
      next();
    });
  } else {
    next();
  }
};
