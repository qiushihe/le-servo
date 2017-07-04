import get from "lodash/fp/get";
import map from "lodash/fp/map";

import {getJoseVerifiedKey} from "src/helpers/request.helper";
import {
  RuntimeError,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND,
  TYPE_UNAUTHORIZED
} from "src/helpers/error.helper";
import {runtimeErrorResponse} from  "src/helpers/response.helper";

const getRequestOrderId = get("params.order_id");

export default ({
  accountService,
  orderService,
  authorizationService,
  directoryService
}) => (req, res) => {
  const key = getJoseVerifiedKey(req);
  const requestOrderId = getRequestOrderId(req);

  orderService.get(requestOrderId).catch(() => {
    throw new RuntimeError({
      message: "Order not found",
      type: TYPE_NOT_FOUND
    });
  }).then((order) => {
    return accountService.get(order.accountId).catch(() => {
      throw new RuntimeError({
        message: "Order.Account not found",
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

      return {order, account};
    });
  }).then(({order, account}) => {
    return authorizationService.find({orderId: order.id}).then((authorizations) => {
      return {order, account, authorizations};
    });
  }).then(({order, authorizations}) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", directoryService.getFullUrl(`/order/${order.id}`));
    res.send(JSON.stringify({
      status: order.status,
      expires: order.expires,
      csr: order.csr,
      notBefore: order.notBefore,
      notAfter: order.notAfter,
      authorizations: map((authorization) => {
        return directoryService.getFullUrl(`/authz/${authorization.id}`);
      })(authorizations)
    })).end();
  }).catch(runtimeErrorResponse(res));
};
