import newAccount from "src/handlers/account/new-account.handler";

const proxiedNewAccount = (request) => {
  const {
    directoryService,
    params: {
      key
    }
  } = request;

  return newAccount(request).then((respond) => {
    const {
      body: {
        orders,
        contact,
        ...restResponseBody
      }
    } = respond;

    const accountId = orders.match(/accounts\/([^\/]*)\/orders/)[1];

    const body = {
      key: key.toJSON(),
      contact,
      "terms-of-service-agreed": restResponseBody["terms-of-service-agreed"],
      authorizations: directoryService.getFullUrl(`/accounts/${accountId}/authz`),
      certificates: directoryService.getFullUrl(`/accounts/${accountId}/certs`)
    };

    return {
      ...respond,
      links: [`${directoryService.getFullUrl("/new-authz")};rel="next"`],
      status: 201,
      body
    };
  });
};

proxiedNewAccount.paramMap = newAccount.paramMap;

export default proxiedNewAccount;
