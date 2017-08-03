import get from "lodash/fp/get";

import getAllRelated from "./get-all-related";

const getChallengeHandler = ({
  challengeService,
  authorizationService,
  orderService,
  accountService,
  directoryService,
  params: {
    challengeId
  }
}) => {
  return getAllRelated({
    challengeId,
    challengeService,
    authorizationService,
    orderService,
    accountService
  }).then(({challenge, authorization}) => {
    const challengeUrl = directoryService.getFullUrl(`/authz/${authorization.id}/${challenge.id}`);
    return {
      contentType: "application/json",
      location: challengeUrl,
      body: {
        type: challenge.type,
        url: challengeUrl,
        status: challenge.status,
        validated: challenge.validated,
        token: challenge.token,
        keyAuthorization: challenge.keyAuthorization
      }
    };
  })
};

getChallengeHandler.requestParams = {
  challengeId: get("params.challenge_id")
};

export default getChallengeHandler;
