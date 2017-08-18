import {convert as convertReduce} from "lodash/fp/reduce";
import isEmpty from "lodash/fp/isEmpty";

import {runtimeErrorResponse} from  "src/helpers/response.helper";

const reduce = convertReduce({cap: false});

export const handleRequest = (handler, options) => (req, res) => {
  handler({
    params: reduce((result, getter, name) => {
      return {...result, [name]: getter(req)};
    }, {})(handler.requestParams || {}),
    ...(options || {})
  }).then(({
    contentType,
    location,
    contentLocation,
    links,
    retryAfter,
    status,
    body,
  }) => {
    if (!isEmpty(contentType)) {
      res.setHeader("Content-Type", contentType);
    }

    if (!isEmpty(location)) {
      res.setHeader("Location", location);
    }

    if (!isEmpty(contentLocation)) {
      res.setHeader("Content-Location", contentLocation);
    }

    if (!isEmpty(links)) {
      res.setHeader("Link", links);
    }

    if (retryAfter) {
      res.setHeader("Retry-After", retryAfter);
    }

    if (status) {
      res = res.status(status);
    }

    if (isEmpty(body) || status === 204) {
      res.end();
    } else {
      if (contentType === "application/json") {
        body = JSON.stringify(body);
      }
      res.send(body).end();
    }
  }).catch(runtimeErrorResponse(res));
};
