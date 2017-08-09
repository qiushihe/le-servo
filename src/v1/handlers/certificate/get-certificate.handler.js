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
    return certificateService.getDer(certificate.id).then((der) => {
      return {certificate, account, der};
    });
  }).then(({certificate, account, der}) => {
    if (certificate.id === "root") {
      return {
        contentType: "application/pkix-cert",
        location: directoryService.getFullUrl(`/cert/ca`),
        body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
      };
    } else {
      return {
        contentType: "application/pkix-cert",
        location: directoryService.getFullUrl(`/cert/${certificate.id}`),
        links: [
          `${directoryService.getFullUrl("/cert/ca")};rel="up"`,
          `${directoryService.getFullUrl(`/accounts/${account.id}`)};rel="author"`,
        ],
        body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
      };
    }
  });
};

getCertificateHandler.requestParams = {
  certificate_id: get("params.certificate_id")
};

export default getCertificateHandler;
