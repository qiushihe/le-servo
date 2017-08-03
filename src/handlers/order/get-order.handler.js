import get from "lodash/fp/get";
import map from "lodash/fp/map";

import {
  RuntimeError,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";

const getOrderHandler = ({
  accountService,
  orderService,
  authorizationService,
  directoryService,
  params: {
    orderId
  }
}) => {
  return orderService.get(orderId).catch(() => {
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
      if (account.status === "deactivated") {
        throw new RuntimeError({
          message: "Order.Account deactivated",
          type: TYPE_FORBIDDEN
        });
      }

      return {order, account};
    });
  }).then(({order, account}) => {
    return authorizationService.filter({orderId: order.id}).then((authorizations) => {
      return {order, account, authorizations};
    });
  }).then(({order, authorizations}) => {
    return {
      contentType: "application/json",
      location: directoryService.getFullUrl(`/order/${order.id}`),
      body: {
        status: order.status,
        expires: order.expires,
        csr: order.csr,
        notBefore: order.notBefore,
        notAfter: order.notAfter,
        authorizations: map((authorization) => {
          return directoryService.getFullUrl(`/authz/${authorization.id}`);
        })(authorizations),
        certificate: null // TODO: Implement this!
      }
    };
  });
};

getOrderHandler.paramMap = {
  orderId: get("params.order_id")
};

export default getOrderHandler;
