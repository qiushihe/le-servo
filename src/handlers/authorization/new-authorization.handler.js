import get from "lodash/fp/get";
import {convert as convertMap} from "lodash/fp/map";

import {getJoseVerifiedKey} from "src/helpers/request.helper";

import {
  RuntimeError,
  TYPE_NOT_FOUND,
  TYPE_FORBIDDEN
} from "src/helpers/error.helper";
import {runtimeErrorResponse} from  "src/helpers/response.helper";

const map = convertMap({cap: false});

const getRequestIdentifierType = get("body.identifier.type");
const getRequestIdentifierValue = get("body.identifier.value");

export default ({
  accountService,
  authorizationService,
  challengeService,
  directoryService,
  v1
}) => (req, res) => {
  const key = getJoseVerifiedKey(req);
  const identifierType = getRequestIdentifierType(req);
  const identifierValue = getRequestIdentifierValue(req);

  accountService.find({kid: key.kid}).then((account) => {
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
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", directoryService.getFullUrl(`/authz/${authorization.id}`));

    if (v1) {
      res.setHeader("Link", `${directoryService.getFullUrl("/new-cert")};rel="next"`);
      res.status(201).send(JSON.stringify({
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
      res.status(201).send(JSON.stringify({
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
