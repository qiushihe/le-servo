import get from "lodash/fp/get";
import isEmpty from "lodash/fp/isEmpty";
import {util as ForgeUtil} from "node-forge";

import {
  RuntimeError,
  TYPE_NOT_FOUND,
  TYPE_PRECONDITION_FAILED
} from "src/helpers/error.helper";

const renewCertificateHandler = ({
  accountService,
  authorizationService,
  certificateService,
  workerService,
  directoryService,
  deferredCertGen,
  params: {
    authorization_id
  }
}) => {
  return authorizationService.get(authorization_id).catch(() => {
    throw new RuntimeError({
      message: "Authorization not found",
      type: TYPE_NOT_FOUND
    });
  }).then((authorization) => {
    if (authorization.status !== "valid" || isEmpty(authorization.csr)) {
      throw new RuntimeError({
        message: "Authorization invalid",
        type: TYPE_PRECONDITION_FAILED
      });
    } else {
      return {authorization};
    }
  }).then(({authorization}) => {
    return accountService.get(authorization.accountId).catch(() => {
      throw new RuntimeError({
        message: "Authorization.Account not found",
        type: TYPE_NOT_FOUND
      });
    }).then((account) => {
      return {authorization, account};
    });
  }).then(({authorization, account}) => {
    return certificateService.create({
      authorizationId: authorization.id
    }).then((certificate) => {
      return {authorization, account, certificate};
    });
  }).then(({authorization, account, certificate}) => {
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

renewCertificateHandler.requestParams = {
  authorization_id: get("params.authorization_id")
};

export default renewCertificateHandler;
