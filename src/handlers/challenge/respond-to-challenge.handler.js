import base64url from "base64url";
import get from "lodash/fp/get";

import {getJoseVerifiedKey} from "src/helpers/request.helper";
import {
  RuntimeError,
  TYPE_UNAUTHORIZED,
  TYPE_PRECONDITION_FAILED,
  TYPE_UNPROCESSABLE_ENTITY
} from "src/helpers/error.helper";

import getAllRelated from "./get-all-related";

const respondToChallengeHandler = ({
  challengeService,
  authorizationService,
  orderService,
  accountService,
  workerService,
  directoryService,
  params: {
    key,
    challengeId,
    challengeType,
    challengeToken,
    challengeKeyAuthorization
  }
}) => {
  return getAllRelated({
    key,
    challengeId,
    challengeService,
    authorizationService,
    orderService,
    accountService
  }).then(({challenge, authorization, order}) => {
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

    if (order && order.status !== "pending") {
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

    if (challengeToken && challengeToken !== challenge.token) {
      throw new RuntimeError({
        message: "Challenge token mis-match",
        type: TYPE_UNAUTHORIZED
      });
    }

    if (challengeType && challengeType !== challenge.type) {
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

    // Having no `order` means it's v1
    const updatePayload = !challenge.order ? {
      // According to https://tools.ietf.org/html/draft-ietf-acme-acme-02#section-7 the `status`
      // attribute of a challenge can not be `processing` therefore we have to keep the `status`
      // as `pending` and use a `processing` attribute to keep track of the challenges that are
      // being processed.
      processing: true,
      status: "pending",
      keyAuthorization: expectedKeyAuthorization
    } : {
      status: "processing",
      keyAuthorization: expectedKeyAuthorization
    };

    return challengeService.update(challenge.id, updatePayload).then((updatedChallenge) => {
      workerService.start("verifyTlsSni01", {
        challengeId: updatedChallenge.id
      });
      return {challenge: updatedChallenge, authorization};
    });
  }).then(({challenge, authorization}) => {
    const challengeUrl = directoryService.getFullUrl(`/authz/${authorization.id}/${challenge.id}`);
    return {
      contentType: "application/json",
      location: challengeUrl,
      body: {
        type: challenge.type,
        url: challengeUrl,
        status: challenge.status,
        validated: challenge.validated,
        token: challenge.token,
        keyAuthorization: challenge.keyAuthorization
      }
    };
  });
};

respondToChallengeHandler.requestParams = {
  key: getJoseVerifiedKey,
  challengeId: get("params.challenge_id"),
  challengeType: get("body.type"),
  challengeToken: get("body.token"),
  challengeKeyAuthorization: get("body.keyAuthorization")
};

export default respondToChallengeHandler;
