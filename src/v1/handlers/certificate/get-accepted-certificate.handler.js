import get from "lodash/fp/get";
import {util as ForgeUtil} from "node-forge";

import getAllRelated from "./get-all-related";

const getAcceptedCertificateHandler = ({
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
    if (certificate.status === "valid") {
      return certificateService.getDer(certificate.id).then((der) => {
        return {certificate, authorization, account, der};
      });
    } else {
      return {certificate, authorization, account};
    }
  }).then(({certificate, authorization, account, der}) => {
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

getAcceptedCertificateHandler.requestParams = {
  certificate_id: get("params.certificate_id")
};

export default getAcceptedCertificateHandler;
