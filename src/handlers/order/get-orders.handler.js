import get from "lodash/fp/get";
import map from "lodash/fp/map";

import {
  RuntimeError,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";
import {runtimeErrorResponse} from  "src/helpers/response.helper";

const getRequestAccountId = get("params.account_id");

export default ({
  accountService,
  orderService,
  directoryService
}) => (req, res) => {
  const requestAccountId = getRequestAccountId(req);

  accountService.get(requestAccountId).catch(() => {
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
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({
      orders: map((order) => {
        return directoryService.getFullUrl(`/order/${order.id}`)
      })(orders)
    })).end();
  }).catch(runtimeErrorResponse(res));
};
