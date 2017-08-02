import get from "lodash/fp/get";

import {getJoseVerifiedKey} from "src/helpers/request.helper";

import {
  RuntimeError,
  TYPE_FORBIDDEN,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";

const newAccounthandler = ({
  directoryService,
  accountService,
  v1,
  params: {
    onlyReturnExisting,
    termsOfServiceAgreed,
    contact,
    key
  }
}) => {
  return accountService.find({kid: key.kid}).then((account) => {
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
    return {
      contentType: "application/json",
      location: directoryService.getFullUrl(`/accounts/${account.id}`),
      ...(v1 ? {
        links: [`${directoryService.getFullUrl("/new-authz")};rel="next"`],
        status: 201,
        body: {
          key: key.toJSON(),
          contact: account.contact,
          "terms-of-service-agreed": account.termsOfServiceAgreed,
          authorizations: directoryService.getFullUrl(`/accounts/${account.id}/authz`),
          certificates: directoryService.getFullUrl(`/accounts/${account.id}/certs`)
        }
      } : {
        body: {
          status: account.status,
          contact: account.contact,
          "terms-of-service-agreed": account.termsOfServiceAgreed,
          orders: directoryService.getFullUrl(`/accounts/${account.id}/orders`)
        }
      }),
    };
  });
};

newAccounthandler.paramMap = {
  onlyReturnExisting: get("body.only-return-existing"),
  termsOfServiceAgreed: get("body.terms-of-service-agreed"),
  contact: get("body.contact"),
  key: getJoseVerifiedKey
};

export default newAccounthandler;
