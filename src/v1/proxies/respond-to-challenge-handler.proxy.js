import respondToChallenge from "src/handlers/challenge/respond-to-challenge.handler";

const proxiedRespondToChallengeHandler = (request) => {
  const {
    directoryService,
    challengeService
  } = request;

  return respondToChallenge(request).then((respond) => {
    const {
      location,
      links,
      body: {
        url,
        ...restResponseBody
      }
    } = respond;

    const authorizationId = location.match(/\/authz\/([^\/]*)\/[^\/]*\/?$/)[1];
    const challengeId = location.match(/\/authz\/[^\/]*\/([^\/]*)\/?$/)[1];

    return challengeService.get(challengeId).then((challenge) => {
      return {
        ...respond,
        ...(challenge.processing ? {status: 202} : {}),
        links: [
          ...(links || []),
          `${directoryService.getFullUrl(`/authz/${authorizationId}`)};rel="up"`
        ],
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
