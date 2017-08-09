import isEmpty from "lodash/fp/isEmpty";

import {getJson} from "src/helpers/json.helper";

export default ({joseService, v1}) => (req, _, next) => {
  const requestBody = getJson(req.body);

  const {
    protected: protectedHeader,
    payload,
    signature
  } = requestBody;

  if (isEmpty(protectedHeader) || isEmpty(payload) || isEmpty(signature)) {
    next();
    return;
  }

  joseService.verify(requestBody, {v1}).then(({
    payload,
    header,
    key
  }) => {
    req.__leServoFilters = req.__leServoFilters || {};
    req.__leServoFilters.jose = req.__leServoFilters.jose || {};
    req.__leServoFilters = {
      ...req.__leServoFilters,
      jose: {
        ...req.__leServoFilters.jose,
        verifiedNonce: header.nonce,
        verifiedKey: key
      }
    };
    req.body = payload;
    next();
  });
};
