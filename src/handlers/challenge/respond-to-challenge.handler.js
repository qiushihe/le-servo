import get from "lodash/fp/get";
import base64url from "base64url";

import {getJoseVerifiedKey} from "src/helpers/request.helper";
import {
  RuntimeError,
  TYPE_UNAUTHORIZED,
  TYPE_PRECONDITION_FAILED,
  TYPE_UNPROCESSABLE_ENTITY
} from "src/helpers/error.helper";
import {runtimeErrorResponse} from  "src/helpers/response.helper";

import getAllRelated from "./get-all-related";

const getRequestChallengeId = get("params.challenge_id");
const getRequestKeyAuthorization = get("body.keyAuthorization");

export default ({
  challengeService,
  authorizationService,
  orderService,
  accountService,
  directoryService
}) => (req, res) => {
  const key = getJoseVerifiedKey(req);
  const challengeId = getRequestChallengeId(req);

  getAllRelated({
    key,
    challengeId,
    challengeService,
    authorizationService,
    orderService,
    accountService
  }).then(({challenge, authorization, order, account}) => {
    if (challenge.type !== "http-01") {
      throw new RuntimeError({
        message: "Challenge type unsupported",
        type: TYPE_UNPROCESSABLE_ENTITY
      });
    }

    if (challenge.status !== "pending") {
      throw new RuntimeError({
        message: "Challenge status unexpected",
        type: TYPE_PRECONDITION_FAILED
      });
    }

    if (authorization.status !== "pending") {
      throw new RuntimeError({
        message: "Challenge.Authorization status unexpected",
        type: TYPE_PRECONDITION_FAILED
      });
    }

    if (order.status !== "pending") {
      throw new RuntimeError({
        message: "Challenge.Authorization.Order status unexpected",
        type: TYPE_PRECONDITION_FAILED
      });
    }

    const requestKeyAuthorization = getRequestKeyAuthorization(req);
    const expectedKeyAuthorization = `${challenge.token}.${base64url(key.thumbprint("SHA-256"))}`;

    if (requestKeyAuthorization !== expectedKeyAuthorization) {
      throw new RuntimeError({
        message: "Challenge keyAuthorization mis-match",
        type: TYPE_UNAUTHORIZED
      });
    }

    // TODO: Do something (spawn a worker?) to actually process the http-01 challenge

    return challengeService.update({
      status: "processing",
      keyAuthorization: expectedKeyAuthorization
    }).then((updatedChallenge) => {
      return {challenge: updatedChallenge, authorization, order, account};
    });
  }).then(({challenge, authorization}) => {
    const challengeUrl = directoryService.getFullUrl(`/authz/${authorization.id}/${challenge.id}`);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", challengeUrl);
    res.send(JSON.stringify({
      type: challenge.type,
      url: challengeUrl,
      status: challenge.status,
      validated: challenge.validated,
      token: challenge.token,
      keyAuthorization: challenge.keyAuthorization
    })).end();
  }).catch(runtimeErrorResponse(res));
};
