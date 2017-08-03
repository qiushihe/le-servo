import get from "lodash/fp/get";
import map from "lodash/fp/map";

import {
  RuntimeError,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";

const getOrdersHandler = ({
  accountService,
  orderService,
  directoryService,
  params: {
    accountId
  }
}) => {
  return accountService.get(accountId).catch(() => {
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

    return account;
  }).then((account) => {
    return orderService.filter({accountId: account.id});
  }).then((orders) => {
    return {
      contentType: "application/json",
      body: {
        orders: map((order) => {
          return directoryService.getFullUrl(`/order/${order.id}`)
        })(orders)
      }
    };
  });
};

getOrdersHandler.requestParams = {
  accountId: get("params.account_id")
};

export default getOrdersHandler;
