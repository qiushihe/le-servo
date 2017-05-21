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
      .then(({payload}) => {
        req.body = payload;
        next();
      });
  }
};
