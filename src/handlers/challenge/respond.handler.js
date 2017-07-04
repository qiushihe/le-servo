import get from "lodash/fp/get";
import base64url from "base64url";

import {getJoseVerifiedKey} from "src/helpers/request.helper";
import {
  RuntimeError,
  TYPE_UNAUTHORIZED,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND,
  TYPE_PRECONDITION_FAILED,
  TYPE_UNPROCESSABLE_ENTITY
} from "src/helpers/error.helper";
import {runtimeErrorResponse} from  "src/helpers/response.helper";

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

  challengeService.get(challengeId).catch(() => {
    throw new RuntimeError({
      message: "Challenge not found",
      type: TYPE_NOT_FOUND
    });
  }).then((challenge) => {
    if (challenge.type !== "http-01") {
      throw new RuntimeError({
        message: "Challenge type unsupported",
        type: TYPE_UNPROCESSABLE_ENTITY
      });
    }

    return authorizationService.get(challenge.authorizationId).catch(() => {
      throw new Error("Challenge.Authorization not found");
    }).then((authorization) => {
      if (authorization.status !== "pending") {
        throw new RuntimeError({
          message: "Challenge.Authorization status unexpected",
          type: TYPE_PRECONDITION_FAILED
        });
      }

      return {challenge, authorization};
    });
  }).then(({challenge, authorization}) => {
    return orderService.get(authorization.orderId).catch(() => {
      throw new RuntimeError({
        message: "Challenge.Authorization.Order not found",
        type: TYPE_NOT_FOUND
      });
    }).then((order) => {
      if (order.status !== "pending") {
        throw new RuntimeError({
          message: "Challenge.Authorization.Order status unexpected",
          type: TYPE_PRECONDITION_FAILED
        });
      }

      return {challenge, authorization, order};
    });
  }).then(({challenge, authorization, order}) => {
    return accountService.get(order.accountId).catch(() => {
      throw new RuntimeError({
        message: "Challenge.Authorization.Order.Account not found",
        type: TYPE_NOT_FOUND
      });
    }).then((account) => {
      if (account.kid !== key.kid) {
        throw new RuntimeError({
          message: "Challenge.Authorization.Order.Account key mis-match",
          type: TYPE_UNAUTHORIZED
        });
      }

      if (account.status === "deactivated") {
        throw new RuntimeError({
          message: "Challenge.Authorization.Order.Account deactivated",
          type: TYPE_FORBIDDEN
        });
      }

      return {challenge, authorization, order, account};
    });
  }).then(({challenge, authorization, order, account}) => {
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
      token: challenge.token
    })).end();
  }).catch(runtimeErrorResponse(res));
};
