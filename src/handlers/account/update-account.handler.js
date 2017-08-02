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

const isValuePresent = (value) => (value === undefined || value === null);

const updateAccountHandler = ({
  accountService,
  directoryService,
  params: {
    accountId,
    contact,
    termsOfServiceAgreed,
    status,
    key
  }
}) => {
  return accountService.get(accountId).catch(() => {
    throw new RuntimeError({message: "Account not found", type: TYPE_NOT_FOUND});
  }).then((account) => {
    if (account.kid !== key.kid) {
      throw new RuntimeError({message: "Account key mis-match", type: TYPE_UNAUTHORIZED});
    }

    if (account.status === "deactivated") {
      throw new RuntimeError({message: "Account deactivated", type: TYPE_FORBIDDEN});
    }

    const payload = omitBy(isValuePresent)({
      contact,
      termsOfServiceAgreed
    });

    return isEmpty(payload)
      ? account
      : accountService.update(accountId, payload);
  }).then((account) => {
    return status === "deactivated"
      ? accountService.update(accountId, {status: "deactivated"})
      : account;
  }).then((account) => {
    return {
      contentType: "application/json",
      location: directoryService.getFullUrl(`/accounts/${account.id}`),
      body: {
        status: account.status,
        contact: account.contact,
        "terms-of-service-agreed": account.termsOfServiceAgreed,
        orders: directoryService.getFullUrl(`/accounts/${account.id}/orders`)
      }
    };
  });
};

updateAccountHandler.paramMap = {
  accountId: get("params.accound_id"),
  contact: get("body.contact"),
  termsOfServiceAgreed: get("body.terms-of-service-agreed"),
  status: get("body.status"),
  key: getJoseVerifiedKey
};

export default updateAccountHandler;
