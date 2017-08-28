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
          const challengeJson = {
            type: challenge.type,
            url: directoryService.getFullUrl(`/authz/${authorization.id}/${challenge.id}`),
            status: challenge.status,
            token: challenge.token,
            keyAuthorization: challenge.keyAuthorization
          };

          if (challenge.status === "valid") {
            challengeJson.validated = challenge.validated;
          }

          return challengeJson;
        })(challenges)
      }
    };
  });
};

getAuthorizationHandler.requestParams = {
  authorizationId: get("params.authorization_id")
};

export default getAuthorizationHandler;
