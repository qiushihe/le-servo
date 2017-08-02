import get from "lodash/fp/get";
import {convert as convertMap} from "lodash/fp/map";

import getAllRelated from "./get-all-related";

const map = convertMap({cap: false});

const getAuthorizationHandler = ({
  challengeService,
  authorizationService,
  orderService,
  accountService,
  directoryService,
  params: {
    authorizationId
  }
}) => {
  return getAllRelated({
    authorizationId,
    challengeService,
    authorizationService,
    orderService,
    accountService
  }).then(({authorization, challenges}) => {
    return {
      contentType: "application/json",
      location: directoryService.getFullUrl(`/authz/${authorization.id}`),
      body: {
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
      }
    };
  });
};

getAuthorizationHandler.paramMap = {
  authorizationId: get("params.authorization_id")
};

export default getAuthorizationHandler;
