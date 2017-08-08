import get from "lodash/fp/get";
import isEmpty from "lodash/fp/isEmpty";
import size from "lodash/fp/size";
import {util as ForgeUtil} from "node-forge";

import {getJoseVerifiedKey} from "src/helpers/request.helper";
import {parseCsr} from "src/helpers/csr.helper";

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
      status: "valid",
      authorizationId: authorization.id,
      csr
    }).then((certificate) => {
      return {account, domain, authorization, certificate};
    });
  }).then(({account, domain, authorization, certificate}) => {
    // TODO: Implement the 202 scenario described under Section 7 of the spec so we can generate
    //       the certificate in a worker in stead of in the main thread.
    return certificateService.sign(certificate.id).then((signedCertificate) => {
      return certificateService.getDer(certificate.id).then((der) => {
        return {account, domain, authorization, certificate: signedCertificate, der};
      });
    });
  }).then(({account, certificate, der}) => {
    // TODO: Return Content-Location as stable URL for this specific instance of the certificate.
    // TODO: Return Location as renewal URL for certificates under this authorization.
    return {
      contentType: "application/pkix-cert",
      location: directoryService.getFullUrl(`/cert/${certificate.id}`),
      links: [
        `${directoryService.getFullUrl("/cert/root")};rel="up"`,
        `${directoryService.getFullUrl(`/accounts/${account.id}`)};rel="author"`,
      ],
      status: 201,
      body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
    };
  });
};

newCertificateHandler.requestParams = {
  csr: get("body.csr"),
  key: getJoseVerifiedKey
};

export default newCertificateHandler;
