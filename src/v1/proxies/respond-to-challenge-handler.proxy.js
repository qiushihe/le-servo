import respondToChallenge from "src/handlers/challenge/respond-to-challenge.handler";

const proxiedRespondToChallengeHandler = (request) => {
  const {challengeService} = request;

  return respondToChallenge(request).then((respond) => {
    const {
      location,
      body: {
        url,
        ...restResponseBody
      }
    } = respond;

    const challengeId = location.match(/\/authz\/[^\/]*\/([^\/]*)\/?$/)[1];

    return challengeService.get(challengeId).then((challenge) => {
      return {
        ...respond,
        ...(challenge.processing ? {status: 202} : {}),
        body: {
          ...restResponseBody,
          uri: url
        }
      };
    });
  });
};

proxiedRespondToChallengeHandler.requestParams = respondToChallenge.requestParams;

export default proxiedRespondToChallengeHandler;
