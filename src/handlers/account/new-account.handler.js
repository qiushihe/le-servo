import get from "lodash/fp/get";

const getRequestTermsOfServiceAgreed = get("body.terms-of-service-agreed");
const getRequestContact = get("body.contact");
const getJoseVerifiedKey = get("__leServoFilters.jose.verifiedKey");

export default ({accountService}) => (req, res) => {
  const termsOfServiceAgreed = getRequestTermsOfServiceAgreed(req);
  const contact = getRequestContact(req);
  const key = getJoseVerifiedKey(req);

  accountService.create({termsOfServiceAgreed, contact, key}).then((account) => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({
      status: account.status,
      contact: account.contact,
      "terms-of-service-agreed": account.termsOfServiceAgreed,
      orders: "http://TODO"
    })).end();

    // TODO: Set location header
    // TODO: Get orders URL
  });
};
