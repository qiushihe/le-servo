import get from "lodash/fp/get";

import {getJoseVerifiedKey} from "helpers/request.helper";

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

  accountService
    .find({kid: key.kid})
    .then((account) => {
      if (account) {
        return account;
      } else if (!onlyReturnExisting) {
        return accountService.create({termsOfServiceAgreed, contact, key});
      } else {
        return null;
      }
    })
    .then((account) => {
      if (account) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Location", directoryService.getFullUrl(`/accounts/${account.id}`));
        res.send(JSON.stringify({
          status: account.status,
          contact: account.contact,
          "terms-of-service-agreed": account.termsOfServiceAgreed,
          orders: "http://TODO" // TODO: Get orders URL
        })).end();
      } else {
        res.status(404).end();
      }
    });
};
