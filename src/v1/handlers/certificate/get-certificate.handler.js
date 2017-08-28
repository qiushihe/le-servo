import get from "lodash/fp/get";
import {util as ForgeUtil} from "node-forge";

import {
  RuntimeError,
  TYPE_PRECONDITION_FAILED
} from "src/helpers/error.helper";

import getAllRelated from "./get-all-related";

const getCertificateHandler = ({
  accountService,
  authorizationService,
  certificateService,
  directoryService,
  params: {
    certificate_id
  }
}) => {
  return getAllRelated({
    certificate_id,
    certificateService,
    authorizationService,
    accountService
  }).then(({certificate, authorization, account}) => {
    if (certificate.id !== "root" && certificate.status !== "valid") {
      throw new RuntimeError({
        message: "Certificate invalid",
        type: TYPE_PRECONDITION_FAILED
      });
    } else {
      return certificateService.getDer(certificate.id).then((der) => {
        return {certificate, authorization, account, der};
      });
    }
  }).then(({certificate, authorization, account, der}) => {
    if (certificate.id === "root") {
      return {
        contentType: "application/pkix-cert",
        location: directoryService.getFullUrl(`/cert/root`),
        body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
      };
    } else {
      return {
        contentType: "application/pkix-cert",
        location: directoryService.getFullUrl(`/cert/renew/${authorization.id}`),
        contentLocation: directoryService.getFullUrl(`/cert/${certificate.id}`),
        links: [
          `<${directoryService.getFullUrl("/cert/root")}>;rel="up"`,
          `<${directoryService.getFullUrl(`/accounts/${account.id}`)}>;rel="author"`,
        ],
        status: 200,
        body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
      };
    }
  });
};

getCertificateHandler.requestParams = {
  certificate_id: get("params.certificate_id")
};

export default getCertificateHandler;
