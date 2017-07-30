import {
  RuntimeError,
  TYPE_UNAUTHORIZED,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";

export default ({
  key,
  authorizationId,
  challengeService,
  authorizationService,
  orderService,
  accountService,
  v1
}) => {
  return authorizationService.get(authorizationId).catch(() => {
    throw new RuntimeError({
      message: "Authorization not found",
      type: TYPE_NOT_FOUND
    });
  }).then((authorization) => {
    if (v1) {
      return {authorization};
    } else {
      return orderService.get(authorization.orderId).catch(() => {
        throw new RuntimeError({
          message: "Authorization.Order not found",
          type: TYPE_NOT_FOUND
        });
      }).then((order) => {
        return {authorization, order};
      });
    }
  }).then(({authorization, order}) => {
    if (v1) {
      return accountService.get(authorization.accountId).catch(() => {
        throw new RuntimeError({
          message: "Authorization.Account not found",
          type: TYPE_NOT_FOUND
        });
      }).then((account) => {
        return {authorization, order, account};
      });
    } else {
      return accountService.get(order.accountId).catch(() => {
        throw new RuntimeError({
          message: "Authorization.Order.Account not found",
          type: TYPE_NOT_FOUND
        });
      }).then((account) => {
        return {authorization, order, account};
      })
    }
  }).then(({authorization, order, account}) => {
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

    return {authorization, order, account};
  }).then(({authorization, order, account}) => {
    return challengeService.filter({authorizationId: authorization.id}).then((challenges) => {
      return {authorization, order, account, challenges};
    });
  });
};
