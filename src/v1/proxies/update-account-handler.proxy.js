import updateAccount from "src/handlers/account/update-account.handler";

const proxiedUpdateAccount = (request) => {
  const {
    directoryService,
    params: {
      key
    }
  } = request;

  return updateAccount(request).then((respond) => {
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
      body
    };
  });
};

proxiedUpdateAccount.requestParams = updateAccount.requestParams;

export default proxiedUpdateAccount;
