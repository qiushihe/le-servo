import get from "lodash/fp/get";
import omitBy from "lodash/fp/omitBy";
import isEmpty from "lodash/fp/isEmpty";

import {getJoseVerifiedKey} from "src/helpers/request.helper";
import {
  RuntimeError,
  TYPE_UNAUTHORIZED,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";
import {runtimeErrorResponse} from  "src/helpers/response.helper";

const getRequestAccountId = get("params.accound_id");
const getRequestTermsOfServiceAgreed = get("body.terms-of-service-agreed");
const getRequestContact = get("body.contact");
const getRequestStatus = get("body.status");
const isValuePresent = (value) => (value === undefined || value === null);

export default ({
  accountService,
  directoryService,
  v1
}) => (req, res) => {
  const key = getJoseVerifiedKey(req);
  const accountId = getRequestAccountId(req);

  accountService.get(accountId).catch(() => {
    throw new RuntimeError({message: "Account not found", type: TYPE_NOT_FOUND});
  }).then((account) => {
    if (account.kid !== key.kid) {
      throw new RuntimeError({message: "Account key mis-match", type: TYPE_UNAUTHORIZED});
    }

    if (account.status === "deactivated") {
      throw new RuntimeError({message: "Account deactivated", type: TYPE_FORBIDDEN});
    }

    const payload = omitBy(isValuePresent)({
      contact: getRequestContact(req),
      termsOfServiceAgreed: getRequestTermsOfServiceAgreed(req)
    });

    return isEmpty(payload)
      ? account
      : accountService.update(accountId, payload);
  }).then((account) => {
    return getRequestStatus(req) === "deactivated"
      ? accountService.update(accountId, {status: "deactivated"})
      : account;
  }).then((account) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", directoryService.getFullUrl(`/accounts/${account.id}`));
    if (v1) {
      res.setHeader("Link", `${directoryService.getFullUrl("/new-authz")};rel="next"`);
      res.send(JSON.stringify({
        key: key.toJSON(),
        contact: account.contact,
        "terms-of-service-agreed": account.termsOfServiceAgreed,
        authorizations: directoryService.getFullUrl(`/accounts/${account.id}/authz`),
        certificates: directoryService.getFullUrl(`/accounts/${account.id}/certs`)
      })).end();
    } else {
      res.send(JSON.stringify({
        status: account.status,
        contact: account.contact,
        "terms-of-service-agreed": account.termsOfServiceAgreed,
        orders: directoryService.getFullUrl(`/accounts/${account.id}/orders`)
      })).end();
    }
  }).catch(runtimeErrorResponse(res));
};
