import get from "lodash/fp/get";
import isEmpty from "lodash/fp/isEmpty";
import size from "lodash/fp/size";

import {getJoseVerifiedKey} from "src/helpers/request.helper";
import {parseCsr} from "src/helpers/certificate.helper";

import {
  RuntimeError,
  TYPE_NOT_FOUND,
  TYPE_FORBIDDEN,
  TYPE_UNPROCESSABLE_ENTITY
} from "src/helpers/error.helper";

const newCertificateHandler = ({
  accountService,
  authorizationService,
  certificateService,
  workerService,
  directoryService,
  params: {
    key,
    csr
  }
}) => {
  return accountService.find({kid: key.kid}).then((account) => {
    if (!account) {
      throw new RuntimeError({message: "Account not found", type: TYPE_NOT_FOUND});
    }

    if (account && account.status === "deactivated") {
      throw new RuntimeError({message: "Account deactivated", type: TYPE_FORBIDDEN});
    }

    return account;
  }).then((account) => {
    return parseCsr(csr).then(({domains = []}) => {
      if (isEmpty(domains) || size(domains) > 1) {
        throw new RuntimeError({
          message: "CSR must contain exactly 1 domain",
          type: TYPE_UNPROCESSABLE_ENTITY
        });
      } else {
        return {account, domain: domains[0]};
      }
    });
  }).then(({account, domain}) => {
    return authorizationService.find({
      accountId: account.id,
      status: "valid",
      identifierType: "dns",
      identifierValue: domain
    }).then((authorization) => {
      return {account, domain, authorization};
    });
  }).then(({account, domain, authorization}) => {
    return certificateService.create({
      authorizationId: authorization.id,
      csr
    }).then((certificate) => {
      return {account, domain, authorization, certificate};
    });
  }).then(({certificate}) => {
    workerService.start("signCertificate", {certificateId: certificate.id});
    return {
      location: directoryService.getFullUrl(`/cert/${certificate.id}`),
      status: 202,
      retryAfter: 5
    };
  });
};

newCertificateHandler.requestParams = {
  csr: get("body.csr"),
  key: getJoseVerifiedKey
};

export default newCertificateHandler;
