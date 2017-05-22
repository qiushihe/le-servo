import isEmpty from "lodash/fp/isEmpty";
import JoseService from "services/jose.service";
import {getJson} from "helpers/json.helper";

export default (req, _, next) => {
  const requestBody = getJson(req.body);

  const {
    protected: protectedHeader,
    payload,
    signature
  } = requestBody;

  if (isEmpty(protectedHeader) || isEmpty(payload) || isEmpty(signature)) {
    next();
  } else {
    JoseService.GetDefaultInstance().verify(requestBody)
      .then(({payload, header}) => {
        req.__leServoFilters = req.__leServoFilters || {};
        req.__leServoFilters.jose = req.__leServoFilters.jose || {};
        req.__leServoFilters = {
          ...req.__leServoFilters,
          jose: {
            ...req.__leServoFilters.jose,
            verifiedNonce: header.nonce
          }
        };
        req.test = 42;
        req.body = payload;
        next();
      });
  }
};
