import onHeaders from "on-headers";
import flow from "lodash/fp/flow";
import reduce from "lodash/fp/reduce";
import isEmpty from "lodash/fp/isEmpty";

const logMessage = ({
  method,
  completeUrl,
  logHeaders,
  headers,
  logBody,
  body,
  res
}) => () => {
  const {statusCode} = res;
  let message = `${statusCode} ${method} ${completeUrl}`;

  if (logHeaders) {
    message = `${message}\n-- Headers: ${headers}`;
  }

  if (logBody) {
    message = `${message}\n-- Body: ${body}`;
  }

  console.log(message);
};

const getQueryString = flow([
  reduce((result, value, key) => {
    return [
      ...result,
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    ];
  }, []),
  (parts) => parts.join("&")
]);

const getCompleteUrl = (req) => {
  const {protocol, url, query} = req;
  const host = req.get('Host');
  const queryString = getQueryString(query);
  const urlWithoutQueryString = `${protocol}://${host}${url}`;

  return isEmpty(queryString)
    ? urlWithoutQueryString
    : `${urlWithoutQueryString}?${queryString}`
};

export default ({logHeaders, logBody}) => (req, res, next) => {
  const {method, headers, body} = req;

  let message = {
    method,
    completeUrl: getCompleteUrl(req),
    res
  };

  if (logHeaders) {
    message = {...message, logHeaders, headers: JSON.stringify(headers)};
  }

  if (logBody) {
    message = {...message, logBody, body: JSON.stringify(body)};
  }

  onHeaders(res, logMessage(message));

  next();
};
