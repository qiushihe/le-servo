import get from "lodash/fp/get";
import map from "lodash/fp/map";
import isEmpty from "lodash/fp/isEmpty";

import {getJoseVerifiedKey} from "src/helpers/request.helper";
import {
  RuntimeError,
  TYPE_BAD_REQUEST,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";

const newOrderHandler = ({
  accountService,
  orderService,
  authorizationService,
  directoryService,
  params: {
    key,
    csr,
    notBefore,
    notAfter
  }
}) => {
  return accountService.find({kid: key.kid}).then((account) => {
    if (!account) {
      throw new RuntimeError({
        message: "Account not found",
        type: TYPE_NOT_FOUND
      });
    }

    if (account.status === "deactivated") {
      throw new RuntimeError({
        message: "Account deactivated",
        type: TYPE_FORBIDDEN
      });
    }

    return account;
  }).then((account) => {
    if (isEmpty(csr)) {
      throw new RuntimeError({
        message: "CSR must not be empty",
        type: TYPE_BAD_REQUEST
      });
    }

    return orderService.create({
      accountId: account.id,
      csr,
      notBefore,
      notAfter
    });
  }).then((order) => {
    return authorizationService.filter({orderId: order.id}).then((authorizations) => {
      return {order, authorizations};
    });
  }).then(({order, authorizations}) => {
    return {
      contentType: "application/json",
      location: directoryService.getFullUrl(`/order/${order.id}`),
      status: 201,
      body: {
        status: order.status,
        expires: order.expires,
        csr: order.csr,
        notBefore: order.notBefore,
        notAfter: order.notAfter,
        authorizations: map((authorization) => {
          return directoryService.getFullUrl(`/authz/${authorization.id}`);
        })(authorizations)
      }
    };
  });
};

newOrderHandler.requestParams = {
  key: getJoseVerifiedKey,
  csr: get("body.csr"),
  notBefore: get("body.notBefore"),
  notAfter: get("body.notAfter")
};

export default newOrderHandler;
