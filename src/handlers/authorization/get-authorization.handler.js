import get from "lodash/fp/get";
import map from "lodash/fp/map";

import {runtimeErrorResponse} from  "src/helpers/response.helper";

import getAllRelated from "./get-all-related";

const getRequestAuthorizationId = get("params.authorization_id");

export default ({
  challengeService,
  authorizationService,
  orderService,
  accountService,
  directoryService
}) => (req, res) => {
  const authorizationId = getRequestAuthorizationId(req);

  getAllRelated((
    authorizationId,
    challengeService,
    authorizationService,
    orderService,
    accountService
  )).then(({authorization, challenges}) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", directoryService.getFullUrl(`/authz/${authorization.id}`));
    res.send(JSON.stringify({
      status: authorization.status,
      expires: authorization.expires,
      identifier: {
        type: authorization.identifierType,
        value: authorization.identifierValue
      },
      challenges: map((challenge) => {
        return {
          type: challenge.type,
          url: directoryService.getFullUrl(`/authz/${authorization.id}/${challenge.id}`),
          status: challenge.status,
          validated: challenge.validated,
          token: challenge.token,
          keyAuthorization: challenge.keyAuthorization
        };
      })(challenges)
    })).end();
  }).catch(runtimeErrorResponse(res));
};
