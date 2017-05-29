import get from "lodash/fp/get";
import isEmpty from "lodash/fp/isEmpty";

import {GetNonceService} from "services/default.services";

const getVerifiedNonce = get("__leServoFilters.jose.verifiedNonce");

export default (req, res, next) => {
  const verifiedNonce = getVerifiedNonce(req);
  if (!isEmpty(verifiedNonce)) {
    GetNonceService().useNonce(verifiedNonce).then(() => {
      next();
    });
  } else {
    next();
  }
};
