import {
  RuntimeError,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";

export default ({
  certificate_id,
  certificateService,
  authorizationService,
  accountService
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
          return {certificate, authorization, account};
        });
      });
    }
  });
};
