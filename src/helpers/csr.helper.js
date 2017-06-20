import {pki as PKI} from "node-forge";
import flow from "lodash/fp/flow";
import filter from "lodash/fp/filter";
import map from "lodash/fp/map";
import get from "lodash/fp/get";
import flatten from "lodash/fp/flatten";
import uniq from "lodash/fp/uniq";
import Promise from "bluebird";

const stringReplace = (search, replacement) => (str) => str.replace(search, replacement);
const stringToLowerCase = (str) => str.toLowerCase();
const padMod4 = (pad) => (str) => (str.length % 4 !== 0 ? padMod4(pad)(`${str}=`) : str);

// There is probably a better regexp somewhere but for now this one would do.
// It matches:
//   (one or more of ((one or more of not a ".") followed by a "."))
//   followed by (one or more of not a ".")
// ... which is good enough for now.
const domainRegExp = new RegExp("^([^\\.]+\\.)+([^\\.]+)$");

export const parseCsr = (encodedCsr) => Promise.resolve().then(() => {
  const pem = flow([
    // Normalize encoded CSR string into base64 encoding
    stringReplace(/-/g, "+"),
    stringReplace(/_/g, "/"),
    padMod4("="),
    // CSR in ACME payload consists of only the base64 encoded string without the wrapping lines
    // on either end.
    (str) => (`-----BEGIN CERTIFICATE REQUEST-----\n${str}\n-----END CERTIFICATE REQUEST-----\n`)
  ])(encodedCsr);

  const {
    subject: {attributes: subjectAttributes = []} = {},
    attributes = []
  } = PKI.certificationRequestFromPem(pem);

  const commonNames = flow([
    filter({name: "commonName"}),
    map(flow([
      get("value"),
      stringToLowerCase
    ]))
  ])(subjectAttributes);

  const extensionNames = flow([
    filter({name: "extensionRequest"}),
    map("extensions"),
    flatten,
    map("altNames"),
    flatten,
    filter({type: 2}),
    map("value")
  ])(attributes);

  return flow([
    uniq,
    filter((domain) => domainRegExp.test(domain))
  ])([...commonNames, ...extensionNames]);
});
