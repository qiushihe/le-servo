import get from "lodash/fp/get";
import {util as ForgeUtil} from "node-forge";

import {
  RuntimeError,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";

const getCertificateHandler = ({
  accountService,
  authorizationService,
  certificateService,
  directoryService,
  params: {
    certificate_id
  }
}) => {
  return certificateService.get(certificate_id).catch(() => {
    throw new RuntimeError({
      message: "Certificate not found",
      type: TYPE_NOT_FOUND
    });
  }).then((certificate) => {
    if (certificate.id === "root") {
      return {certificate};
    } else {
      return authorizationService.get(certificate.authorizationId).catch(() => {
        throw new RuntimeError({
          message: "Certificate.Authorization not found",
          type: TYPE_NOT_FOUND
        });
      }).then((authorization) => {
        return accountService.get(authorization.accountId).catch(() => {
          throw new RuntimeError({
            message: "Certificate.Authorization.Account not found",
            type: TYPE_NOT_FOUND
          });
        }).then((account) => {
          return {certificate, account};
        });
      });
    }
  }).then(({certificate, account}) => {
    if (certificate.id === "root" || certificate.status === "valid") {
      return certificateService.getDer(certificate.id).then((der) => {
        return {certificate, account, der};
      });
    } else {
      return {certificate, account};
    }
  }).then(({certificate, account, der}) => {
    if (certificate.id === "root") {
      return {
        contentType: "application/pkix-cert",
        location: directoryService.getFullUrl(`/cert/root`),
        body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
      };
    } else if (certificate.status === "valid") {
      return {
        contentType: "application/pkix-cert",
        // TODO: Location needs to be the renewal URL for certificates under this authorization
        location: directoryService.getFullUrl(`/cert/${certificate.id}`),
        // TODO: Content-Locaiton needs to be the URL for this specific instance of the certificate
        contentLocation: directoryService.getFullUrl(`/cert/${certificate.id}`),
        links: [
          `${directoryService.getFullUrl("/cert/root")};rel="up"`,
          `${directoryService.getFullUrl(`/accounts/${account.id}`)};rel="author"`,
        ],
        // TODO: Return 201 for Location URL and 200 for Content-Location URL
        status: 201,
        body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
      };
    } else {
      return {
        location: directoryService.getFullUrl(`/cert/${certificate.id}`),
        status: 202,
        retryAfter: 5
      };
    }
  });
};

getCertificateHandler.requestParams = {
  certificate_id: get("params.certificate_id")
};

export default getCertificateHandler;
