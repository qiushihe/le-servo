import get from "lodash/fp/get";

import {runtimeErrorResponse} from  "src/helpers/response.helper";

const getRequestChallengeId = get("params.challenge_id");

import getAllRelated from "./get-all-related";

export default ({
  challengeService,
  authorizationService,
  orderService,
  accountService,
  directoryService
}) => (req, res) => {
  const challengeId = getRequestChallengeId(req);

  getAllRelated({
    challengeId,
    challengeService,
    authorizationService,
    orderService,
    accountService
  }).then(({challenge, authorization}) => {
    const challengeUrl = directoryService.getFullUrl(`/authz/${authorization.id}/${challenge.id}`);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Location", challengeUrl);
    res.send(JSON.stringify({
      type: challenge.type,
      url: challengeUrl,
      status: challenge.status,
      validated: challenge.validated,
      token: challenge.token,
      keyAuthorization: challenge.keyAuthorization
    })).end();
  }).catch(runtimeErrorResponse(res));
};
