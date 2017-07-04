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
import {runtimeErrorResponse} from  "src/helpers/response.helper";

const getRequestCsr = get("body.csr");
const getRequestNotBefore = get("body.notBefore");
const getRequestNotAfter = get("body.notAfter");

export default ({
  accountService,
  orderService,
  authorizationService,
  directoryService
}) => (req, res) => {
  const key = getJoseVerifiedKey(req);
  const requestCsr = getRequestCsr(req);
  const requestNotBefore = getRequestNotBefore(req);
  const requestNotAfter = getRequestNotAfter(req);

  accountService.find({kid: key.kid}).then((account) => {
    if (!account) {
      throw new RuntimeError({message: "Account not found", type: TYPE_NOT_FOUND});
    }

    if (account.status === "deactivated") {
      throw new RuntimeError({message: "Account deactivated", type: TYPE_FORBIDDEN});
    }

    return account;
  }).then((account) => {
    if (isEmpty(requestCsr)) {
      throw new RuntimeError({message: "CSR must not be empty", type: TYPE_BAD_REQUEST});
    }

    return orderService.create({
      accountId: account.id,
      csr: requestCsr,
      notBefore: requestNotBefore,
      notAfter: requestNotAfter
    });
  }).then((order) => {
    return authorizationService.find({orderId: order.id}).then((authorizations) => {
      return {order, authorizations};
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
