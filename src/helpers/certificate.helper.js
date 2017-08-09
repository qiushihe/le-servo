import flow from "lodash/fp/flow";
import filter from "lodash/fp/filter";
import map from "lodash/fp/map";
import get from "lodash/fp/get";
import flatten from "lodash/fp/flatten";
import uniq from "lodash/fp/uniq";
import Promise from "bluebird";
import {
  pki as PKI,
  util as ForgeUtil,
  random as ForgeRandom
} from "node-forge";

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

  const parsedCsr = PKI.certificationRequestFromPem(pem);

  const {
    subject: {attributes: subjectAttributes = []} = {},
    attributes = []
  } = parsedCsr;

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

  const domains = flow([
    uniq,
    filter((domain) => domainRegExp.test(domain))
  ])([...commonNames, ...extensionNames]);

  return {csr: parsedCsr, domains};
});

export const generateDummyRootCertificateAndKey = () => {
  const attrs = [
    {valueTagClass: 19, value: 'CA', name: 'countryName', shortName: 'C'},
    {valueTagClass: 19, value: 'British Columbia', name: 'stateOrProvinceName', shortName: 'ST'},
    {valueTagClass: 19, value: 'Victoria', name: 'localityName', shortName: 'L'},
    {valueTagClass: 19, value: 'LE Servo Co.', name: 'organizationName', shortName: 'O'},
    {valueTagClass: 19, value: 'LE Servo Dpt.', name: 'organizationalUnitName', shortName: 'OU'},
    {valueTagClass: 19, value: 'LE Servo CA', name: 'commonName', shortName: 'CN'},
    {valueTagClass: 22, value: 'dummy-ca@test.com', name: 'emailAddress', shortName: 'E'}
  ];

  const keys = PKI.rsa.generateKeyPair(1024);
  const cert = PKI.createCertificate();

  cert.serialNumber = ForgeUtil.bytesToHex(ForgeRandom.getBytesSync(4));
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  cert.setExtensions([
    {name: 'basicConstraints', cA: true}
  ]);

  cert.publicKey = keys.publicKey;
  cert.sign(keys.privateKey);

  return {
    certificate: cert,
    privateKey: keys.privateKey
  };
};

export const signCertificate = ({
  domain,
  issuerAttributes,
  publicKey,
  privateKey
}) => {
  const cert = PKI.createCertificate();

  cert.serialNumber = ForgeUtil.bytesToHex(ForgeRandom.getBytesSync(4));
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  cert.setSubject([{ name: "commonName", value: domain }]);
  cert.setIssuer(issuerAttributes);

  cert.setExtensions([
    {name: "basicConstraints", cA: false},
    {name: "keyUsage", digitalSignature: true, keyEncipherment: true},
    {name: "extKeyUsage", serverAuth: true},
    {name: "subjectAltName", altNames: [{ type: 2, value: domain }]}
  ]);

  cert.publicKey = publicKey;
  cert.sign(privateKey);

  return cert;
};
