import getChallenge from "src/handlers/challenge/get-challenge.handler";

const proxiedGetChallengeHandler = (request) => {
  const {
    challengeService
  } = request;

  return getChallenge(request).then((respond) => {
    const {location} = respond;
    const challengeId = location.match(/\/authz\/[^\/]*\/([^\/]*)\/?$/)[1];

    return challengeService.get(challengeId).then((challenge) => {
      return {
        ...respond,
        ...(challenge.processing ? {status: 202} : {})
      };
    });
  });
};

proxiedGetChallengeHandler.requestParams = getChallenge.requestParams;

export default proxiedGetChallengeHandler;
