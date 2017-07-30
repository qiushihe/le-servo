import get from "lodash/fp/get";
import {convert as convertMap} from "lodash/fp/map";

import {runtimeErrorResponse} from  "src/helpers/response.helper";

import getAllRelated from "./get-all-related";

const map = convertMap({cap: false});

const getRequestAuthorizationId = get("params.authorization_id");

export default ({
  challengeService,
  authorizationService,
  orderService,
  accountService,
  directoryService,
  v1
}) => (req, res) => {
  const authorizationId = getRequestAuthorizationId(req);

  getAllRelated({
    authorizationId,
    challengeService,
    authorizationService,
    orderService,
    accountService,
    v1
  }).then(({authorization, challenges}) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", directoryService.getFullUrl(`/authz/${authorization.id}`));
    if (v1) {
      res.setHeader("Link", `${directoryService.getFullUrl("/new-cert")};rel="next"`);
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
            uri: directoryService.getFullUrl(`/authz/${authorization.id}/${challenge.id}`),
            status: challenge.status,
            validated: challenge.validated,
            token: challenge.token,
            keyAuthorization: challenge.keyAuthorization
          };
        })(challenges),
        combinations: map((_, index) => ([index]))(challenges)
      })).end();
    } else {
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
    }
  }).catch(runtimeErrorResponse(res));
};
