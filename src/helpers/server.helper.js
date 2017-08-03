import {convert as convertReduce} from "lodash/fp/reduce";
import each from "lodash/fp/each";
import isEmpty from "lodash/fp/isEmpty";

import {runtimeErrorResponse} from  "src/helpers/response.helper";

const reduce = convertReduce({cap: false});

export const handleRequest = (handler, options) => (req, res) => {
  handler({
    params: reduce((result, getter, name) => {
      return {...result, [name]: getter(req)};
    }, {})(handler.requestParams),
    ...(options || {})
  }).then(({
    contentType,
    location,
    links,
    status,
    body,
  }) => {
    if (!isEmpty(contentType)) {
      res.setHeader("Content-Type", contentType);
    }

    if (!isEmpty(location)) {
      res.setHeader("Location", location);
    }

    each((link) => {
      res.setHeader("Link", link);
    })(links);

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
