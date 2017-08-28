import get from "lodash/fp/get";
import isEmpty from "lodash/fp/isEmpty";
import size from "lodash/fp/size";
import {util as ForgeUtil} from "node-forge";

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
  deferredCertGen,
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
    return authorizationService.update(authorization.id, {
      csr
    }).then((updatedAuthorization) => {
      return {account, domain, authorization: updatedAuthorization};
    });
  }).then(({account, domain, authorization}) => {
    return certificateService.create({
      authorizationId: authorization.id
    }).then((certificate) => {
      return {account, domain, authorization, certificate};
    });
  }).then(({account, authorization, certificate}) => {
    const signCertificatePromise = workerService.start("signCertificate", {
      certificateId: certificate.id
    });

    // If deferred certificate creation flow is not supported, we return after waiting for the
    // promise from the certificate signing worker which only resolves after the certificate is
    // signed, and the certificate object no longer has a "pending" status.
    // If deferred certificate creation flow is supported we just return without waiting for the
    // promise from the certificate signing worker.
    return deferredCertGen
      ? {account, authorization, certificate}
      : signCertificatePromise.then(() => {
        return certificateService.get(certificate.id);
      }).then((signedCertificate) => {
        return {account, authorization, certificate: signedCertificate};
      });
  }).then(({account, authorization, certificate}) => {
    if (certificate.status === "valid") {
      return certificateService.getDer(certificate.id).then((der) => {
        return {account, authorization, certificate, der};
      });
    } else {
      return {account, authorization, certificate};
    }
  }).then(({account, authorization, certificate, der}) => {
    if (certificate.status === "valid") {
      return {
        contentType: "application/pkix-cert",
        location: directoryService.getFullUrl(`/cert/renew/${authorization.id}`),
        contentLocation: directoryService.getFullUrl(`/cert/${certificate.id}`),
        links: [
          `<${directoryService.getFullUrl("/cert/root")}>;rel="up"`,
          `<${directoryService.getFullUrl(`/accounts/${account.id}`)}>;rel="author"`,
        ],
        status: 201,
        body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
      };
    } else {
      return {
        location: directoryService.getFullUrl(`/cert/accepted/${certificate.id}`),
        status: 202,
        retryAfter: 5
      };
    }
  });
};

newCertificateHandler.requestParams = {
  csr: get("body.csr"),
  key: getJoseVerifiedKey
};

export default newCertificateHandler;
