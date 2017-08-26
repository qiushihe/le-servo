import get from "lodash/fp/get";
import map from "lodash/fp/map";

import {getJoseVerifiedKey} from "src/helpers/request.helper";

import {
  RuntimeError,
  TYPE_NOT_FOUND,
  TYPE_FORBIDDEN
} from "src/helpers/error.helper";

const newAuthorizationHandler = ({
  accountService,
  authorizationService,
  challengeService,
  directoryService,
  params: {
    key,
    identifierType,
    identifierValue
  }
}) => {
  return accountService.find({kid: key.kid}).then((account) => {
    if (!account) {
      throw new RuntimeError({message: "Account not found", type: TYPE_NOT_FOUND});
    }

    if (account && account.status === "deactivated") {
      throw new RuntimeError({message: "Account deactivated", type: TYPE_FORBIDDEN});
    }

    return account;
  }).then((account) => {
    return authorizationService.create({
      accountId: account.id,
      identifierType,
      identifierValue
    });
  }).then((authorization) => {
    return challengeService.filter({authorizationId: authorization.id}).then((challenges) => {
      return {authorization, challenges};
    });
  }).then(({authorization, challenges}) => {
    return {
      contentType: "application/json",
      location: directoryService.getFullUrl(`/authz/${authorization.id}`),
      status: 201,
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

newAuthorizationHandler.requestParams = {
  identifierType: get("body.identifier.type"),
  identifierValue: get("body.identifier.value"),
  key: getJoseVerifiedKey
};

export default newAuthorizationHandler;
