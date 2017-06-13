import get from "lodash/fp/get";
import omitBy from "lodash/fp/omitBy";
import isEmpty from "lodash/fp/isEmpty";

import {getJoseVerifiedKey} from "helpers/request.helper";

const getRequestAccountId = get("params.accound_id");
const getRequestTermsOfServiceAgreed = get("body.terms-of-service-agreed");
const getRequestContact = get("body.contact");

export default ({accountService, directoryService}) => (req, res) => {
  const key = getJoseVerifiedKey(req);
  const accountId = getRequestAccountId(req);

  accountService.get(accountId).catch((err) => {
    res.status(404).end();
    throw err;
  }).then((account) => {
    if (account.kid !== key.kid) {
      res.status(401).end();
      throw new Error("Account key mis-match");
    }

    const payload = omitBy((value) => {
      return value === undefined || value === null;
    })({
      contact: getRequestContact(req),
      termsOfServiceAgreed: getRequestTermsOfServiceAgreed(req)
    });

    return isEmpty(payload)
      ? account
      : accountService.update(accountId, payload);
  }).then((account) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", directoryService.getFullUrl(`/accounts/${account.id}`));
    res.send(JSON.stringify({
      status: account.status,
      contact: account.contact,
      "terms-of-service-agreed": account.termsOfServiceAgreed,
      orders: "http://TODO" // TODO: Get orders URL
    })).end();
  });
};
