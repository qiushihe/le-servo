import get from "lodash/fp/get";
import isEmpty from "lodash/fp/isEmpty";

import {
  RuntimeError,
  TYPE_NOT_FOUND,
  TYPE_PRECONDITION_FAILED
} from "src/helpers/error.helper";

const renewCertificateHandler = ({
  authorizationService,
  certificateService,
  workerService,
  directoryService,
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
    return certificateService.create({
      authorizationId: authorization.id
    }).then((certificate) => {
      return {authorization, certificate};
    });
  }).then(({certificate}) => {
    workerService.start("signCertificate", {certificateId: certificate.id});
    return {
      location: directoryService.getFullUrl(`/cert/accepted/${certificate.id}`),
      status: 202,
      retryAfter: 5
    };
  });
};

renewCertificateHandler.requestParams = {
  authorization_id: get("params.authorization_id")
};

export default renewCertificateHandler;
