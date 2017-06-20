import get from "lodash/fp/get";

import {getJoseVerifiedKey} from "src/helpers/request.helper";

const getRequestOnlyReturnExisting = get("body.only-return-existing");
const getRequestTermsOfServiceAgreed = get("body.terms-of-service-agreed");
const getRequestContact = get("body.contact");

export default ({
  directoryService,
  accountService
}) => (req, res) => {
  const onlyReturnExisting = getRequestOnlyReturnExisting(req);
  const termsOfServiceAgreed = getRequestTermsOfServiceAgreed(req);
  const contact = getRequestContact(req);
  const key = getJoseVerifiedKey(req);

  accountService.find({kid: key.kid}).then((account) => {
    if (!account && onlyReturnExisting) {
      throw new Error("Account not found");
    }

    if (account && account.status === "deactivated") {
      throw new Error("Account deactivated");
    }

    return account
      ? account
      : accountService.create({termsOfServiceAgreed, contact, key});
  })
  .then((account) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", directoryService.getFullUrl(`/accounts/${account.id}`));
    res.send(JSON.stringify({
      status: account.status,
      contact: account.contact,
      "terms-of-service-agreed": account.termsOfServiceAgreed,
      orders: directoryService.getFullUrl(`/accounts/${account.id}/orders`)
    })).end();
  }).catch(({message}) => {
    if (message === "Account not found") {
      res.status(404).send(message).end();
    } else if (message === "Account deactivated") {
      res.status(403).send(message).end();
    } else {
      res.status(500).send(message).end();
    }
  });
};
