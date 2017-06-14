import get from "lodash/fp/get";
import omitBy from "lodash/fp/omitBy";
import isEmpty from "lodash/fp/isEmpty";

import {getJoseVerifiedKey} from "helpers/request.helper";

const getRequestAccountId = get("params.accound_id");
const getRequestTermsOfServiceAgreed = get("body.terms-of-service-agreed");
const getRequestContact = get("body.contact");
const getRequestStatus = get("body.status");
const isValuePresent = (value) => (value === undefined || value === null);

export default ({accountService, directoryService}) => (req, res) => {
  const key = getJoseVerifiedKey(req);
  const accountId = getRequestAccountId(req);

  accountService.get(accountId).catch(() => {
    throw new Error("Account not found");
  }).then((account) => {
    if (account.kid !== key.kid) {
      throw new Error("Account key mis-match");
    }

    if (account.status === "deactivated") {
      throw new Error("Account deactivated");
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
      ? accountService.deactivate(accountId)
      : account;
  }).then((account) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", directoryService.getFullUrl(`/accounts/${account.id}`));
    res.send(JSON.stringify({
      status: account.status,
      contact: account.contact,
      "terms-of-service-agreed": account.termsOfServiceAgreed,
      orders: "http://TODO" // TODO: Get orders URL
    })).end();
  }).catch(({message}) => {
    if (message === "Account not found") {
      res.status(404).send(message).end();
    } else if (message === "Account key mis-match") {
      res.status(401).send(message).end();
    } else if (message === "Account deactivated") {
      res.status(403).send(message).end();
    } else {
      res.status(500).send(message).end();
    }
  });
};
