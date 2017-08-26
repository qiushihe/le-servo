import getChallenge from "src/handlers/challenge/get-challenge.handler";

const proxiedGetChallengeHandler = (request) => {
  const {
    directoryService,
    challengeService
  } = request;

  return getChallenge(request).then((respond) => {
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

proxiedGetChallengeHandler.requestParams = getChallenge.requestParams;

export default proxiedGetChallengeHandler;
