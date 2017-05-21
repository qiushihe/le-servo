import isString from "lodash/fp/isString";

export default (req, res) => {
  const {body: requestBody} = req;
  const responseBody = isString(requestBody) ? requestBody : JSON.stringify(requestBody);
  res.send(responseBody).end();
};
