import get from "lodash/fp/get";

import {getJoseVerifiedKey} from "src/helpers/request.helper";

import {
  RuntimeError,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";
import {runtimeErrorResponse} from  "src/helpers/response.helper";

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
      throw new RuntimeError({message: "Account not found", type: TYPE_NOT_FOUND});
    }

    if (account && account.status === "deactivated") {
      throw new RuntimeError({message: "Account deactivated", type: TYPE_FORBIDDEN});
    }

    return account
      ? account
      : accountService.create({termsOfServiceAgreed, contact, key});
  })
  .then((account) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", directoryService.getFullUrl(`/accounts/${account.id}`));
    res.status(201).send(JSON.stringify({
      status: account.status,
      contact: account.contact,
      "terms-of-service-agreed": account.termsOfServiceAgreed,
      orders: directoryService.getFullUrl(`/accounts/${account.id}/orders`)
    })).end();
  }).catch(runtimeErrorResponse(res));
};
