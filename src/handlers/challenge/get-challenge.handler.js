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

    const challengeJson = {
      type: challenge.type,
      url: challengeUrl,
      status: challenge.status,
      token: challenge.token,
      keyAuthorization: challenge.keyAuthorization
    };

    if (challenge.status === "valid") {
      challengeJson.validated = challenge.validated;
    }

    return {
      contentType: "application/json",
      location: challengeUrl,
      body: challengeJson
    };
  })
};

getChallengeHandler.requestParams = {
  challengeId: get("params.challenge_id")
};

export default getChallengeHandler;
