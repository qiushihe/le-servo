import onHeaders from "on-headers";
import flow from "lodash/fp/flow";
import reduce from "lodash/fp/reduce";
import isEmpty from "lodash/fp/isEmpty";

const logMessage = ({
  method,
  completeUrl,
  res
}) => () => {
  const {statusCode} = res;
  console.log(`${statusCode} ${method} ${completeUrl}`);
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

export default () => (req, res, next) => {
  const {method} = req;

  onHeaders(res, logMessage({
    method,
    completeUrl: getCompleteUrl(req),
    res
  }));

  next();
};
