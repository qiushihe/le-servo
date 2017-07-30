import {
  RuntimeError,
  TYPE_UNAUTHORIZED,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";

export default ({
  key,
  challengeId,
  challengeService,
  authorizationService,
  orderService,
  accountService,
  v1
}) => {
  return challengeService.get(challengeId).catch(() => {
    throw new RuntimeError({
      message: "Challenge not found",
      type: TYPE_NOT_FOUND
    });
  }).then((challenge) => {
    return authorizationService.get(challenge.authorizationId).catch(() => {
      throw new RuntimeError({
        message: "Challenge.Authorization not found",
        type: TYPE_NOT_FOUND
      });
    }).then((authorization) => {
      return {challenge, authorization};
    });
  }).then(({challenge, authorization}) => {
    if (v1) {
      return {challenge, authorization};
    } else {
      return orderService.get(authorization.orderId).catch(() => {
        throw new RuntimeError({
          message: "Challenge.Authorization.Order not found",
          type: TYPE_NOT_FOUND
        });
      }).then((order) => {
        return {challenge, authorization, order};
      });
    }
  }).then(({challenge, authorization, order}) => {
    if (v1) {
      return accountService.get(authorization.accountId).catch(() => {
        throw new RuntimeError({
          message: "Challenge.Authorization.Account not found",
          type: TYPE_NOT_FOUND
        });
      }).then((account) => {
        return {challenge, authorization, order, account};
      });
    } else {
      return accountService.get(order.accountId).catch(() => {
        throw new RuntimeError({
          message: "Challenge.Authorization.Order.Account not found",
          type: TYPE_NOT_FOUND
        });
      }).then((account) => {
        return {challenge, authorization, order, account};
      });
    }
  }).then(({challenge, authorization, order, account}) => {
    if (key && account.kid !== key.kid) {
      throw new RuntimeError({
        message: v1
          ? "Challenge.Authorization.Account key mis-match"
          : "Challenge.Authorization.Order.Account key mis-match",
        type: TYPE_UNAUTHORIZED
      });
    }

    if (account.status === "deactivated") {
      throw new RuntimeError({
        message: v1
          ? "Challenge.Authorization.Account deactivated"
          : "Challenge.Authorization.Order.Account deactivated",
        type: TYPE_FORBIDDEN
      });
    }

    return {challenge, authorization, order, account};
  });
};
