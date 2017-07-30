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
const getRequestType = get("body.type");
const getRequestToken = get("body.token");
const getRequestKeyAuthorization = get("body.keyAuthorization");

export default ({
  challengeService,
  authorizationService,
  orderService,
  accountService,
  directoryService,
  v1
}) => (req, res) => {
  const key = getJoseVerifiedKey(req);
  const challengeId = getRequestChallengeId(req);
  const challengeType = getRequestType(req);
  const challengeToken = getRequestToken(req);
  const challengeKeyAuthorization = getRequestKeyAuthorization(req);

  getAllRelated({
    key,
    challengeId,
    challengeService,
    authorizationService,
    orderService,
    accountService,
    v1
  }).then(({challenge, authorization, order, account}) => {
    if (challenge.type !== "tls-sni-01") {
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

    if (!v1 && order.status !== "pending") {
      throw new RuntimeError({
        message: "Challenge.Authorization.Order status unexpected",
        type: TYPE_PRECONDITION_FAILED
      });
    }

    return key.thumbprint("SHA-256").then((thumbprint) => {
      return {challenge, authorization, thumbprint};
    });
  }).then(({challenge, authorization, thumbprint}) => {
    const expectedKeyAuthorization = `${challenge.token}.${base64url(thumbprint)}`;

    if (challengeToken !== challenge.token) {
      throw new RuntimeError({
        message: "Challenge token mis-match",
        type: TYPE_UNAUTHORIZED
      });
    }

    if (challengeType !== challenge.type) {
      throw new RuntimeError({
        message: "Challenge type mis-match",
        type: TYPE_UNAUTHORIZED
      });
    }

    if (challengeKeyAuthorization !== expectedKeyAuthorization) {
      throw new RuntimeError({
        message: "Challenge keyAuthorization mis-match",
        type: TYPE_UNAUTHORIZED
      });
    }

    // TODO: Do something (spawn a worker?) to actually process the challenge

    const updatePayload = v1 ? {
      processing: true,
      status: "pending",
      keyAuthorization: expectedKeyAuthorization
    } : {
      status: "processing",
      keyAuthorization: expectedKeyAuthorization
    };

    return challengeService.update(challenge.id, updatePayload).then((updatedChallenge) => {
      return {challenge: updatedChallenge, authorization};
    });
  }).then(({challenge, authorization}) => {
    const challengeUrl = directoryService.getFullUrl(`/authz/${authorization.id}/${challenge.id}`);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", challengeUrl);
    if (v1) {
      res.status(202).send(JSON.stringify({
        type: challenge.type,
        uri: challengeUrl,
        status: challenge.status,
        validated: challenge.validated,
        token: challenge.token,
        keyAuthorization: challenge.keyAuthorization
      })).end();
    } else {
      res.send(JSON.stringify({
        type: challenge.type,
        url: challengeUrl,
        status: challenge.status,
        validated: challenge.validated,
        token: challenge.token,
        keyAuthorization: challenge.keyAuthorization
      })).end();
    }
  }).catch(runtimeErrorResponse(res));
};
