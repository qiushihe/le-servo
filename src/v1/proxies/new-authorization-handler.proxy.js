import {convert as convertMap} from "lodash/fp/map";

import newAuthorization from "src/handlers/authorization/new-authorization.handler";

const map = convertMap({cap: false});

const proxiedNewAuthorization = (request) => {
  const {directoryService} = request;

  return newAuthorization(request).then((respond) => {
    const {
      body: {
        challenges,
        ...restResponseBody
      }
    } = respond;

    return {
      ...respond,
      links: [`<${directoryService.getFullUrl("/new-cert")}>;rel="next"`],
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

proxiedNewAuthorization.requestParams = newAuthorization.requestParams;

export default proxiedNewAuthorization;
