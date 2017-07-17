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
  accountService
}) => {
  return authorizationService.get(authorizationId).catch(() => {
    throw new RuntimeError({
      message: "Authorization not found",
      type: TYPE_NOT_FOUND
    });
  }).then((authorization) => {
    return orderService.get(authorization.orderId).catch(() => {
      throw new RuntimeError({
        message: "Authorization.Order not found",
        type: TYPE_NOT_FOUND
      });
    }).then((order) => {
      return {authorization, order};
    });
  }).then(({authorization, order}) => {
    return accountService.get(order.accountId).catch(() => {
      throw new RuntimeError({
        message: "Authorization.Order.Account not found",
        type: TYPE_NOT_FOUND
      });
    }).then((account) => {
      if (key && account.kid !== key.kid) {
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

      return {authorization, order, account};
    });
  }).then(({authorization, order, account}) => {
    return challengeService.find({authorizationId: authorization.id}).then((challenges) => {
      return {authorization, order, account, challenges};
    });
  });
};
