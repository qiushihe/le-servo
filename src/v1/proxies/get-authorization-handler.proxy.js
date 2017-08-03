import {convert as convertMap} from "lodash/fp/map";

import getAuthorization from "src/handlers/authorization/get-authorization.handler";

const map = convertMap({cap: false});

const proxiedGetAuthorization = (request) => {
  const {directoryService} = request;

  return getAuthorization(request).then((respond) => {
    const {
      body: {
        challenges,
        ...restResponseBody
      }
    } = respond;

    return {
      ...respond,
      links: [`${directoryService.getFullUrl("/new-cert")};rel="next"`],
      body: {
        ...restResponseBody,
        challenges: map(({url, ...restChallenge}) => {
          return {
            ...restChallenge,
            uri: url
          };
        })(challenges),
        combinations: map((_, index) => ([index]))(challenges)
      }
    };
  });
};

proxiedGetAuthorization.requestParams = getAuthorization.requestParams;

export default proxiedGetAuthorization;
