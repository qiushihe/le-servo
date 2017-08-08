import Promise from "bluebird";
import uuidV4 from "uuid/v4";
import isEmpty from "lodash/fp/isEmpty";
import size from "lodash/fp/size";
import {
  pki as PKI,
  asn1 as ASN1,
  util as ForgeUtil,
  random as ForgeRandom
} from "node-forge";

import {parseCsr} from "src/helpers/csr.helper";

const DEFAULT_ROOT_CERT_PEM = [
  "-----BEGIN CERTIFICATE-----",
  "MIIDyDCCAzGgAwIBAgIJAJd2YhQfGUB+MA0GCSqGSIb3DQEBCwUAMIGfMQswCQYD",
  "VQQGEwJDQTEZMBcGA1UECBMQQnJpdGlzaCBDb2x1bWJpYTERMA8GA1UEBxMIVmlj",
  "dG9yaWExFTATBgNVBAoTDExFIFNlcnZvIENvLjEWMBQGA1UECxMNTEUgU2Vydm8g",
  "RHB0LjERMA8GA1UEAxMIRHVtbXkgQ0ExIDAeBgkqhkiG9w0BCQEWEWR1bW15LWNh",
  "QHRlc3QuY29tMB4XDTE3MDgwNzA3MDIwNFoXDTIwMDUyNzA3MDIwNFowgZ8xCzAJ",
  "BgNVBAYTAkNBMRkwFwYDVQQIExBCcml0aXNoIENvbHVtYmlhMREwDwYDVQQHEwhW",
  "aWN0b3JpYTEVMBMGA1UEChMMTEUgU2Vydm8gQ28uMRYwFAYDVQQLEw1MRSBTZXJ2",
  "byBEcHQuMREwDwYDVQQDEwhEdW1teSBDQTEgMB4GCSqGSIb3DQEJARYRZHVtbXkt",
  "Y2FAdGVzdC5jb20wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBANMT4Ebmi8f/",
  "3XRy6AIMnjhsNfkvrqPL766mScJ4rRXPFDHGt2vbFrUyKHHzCIfH4Ov1Pa/FzOX4",
  "Rv9c+HasLhnX4okB87hKBOnPB595QHKMnYumcAPTWiEWq+gaYJDezzlXuSH/GLs3",
  "IoCxcZgLl4+52dXGbkZ0+xnmONoQl3bPAgMBAAGjggEIMIIBBDAdBgNVHQ4EFgQU",
  "O28HHLNHpOMWlJ8hWSSANCubp+4wgdQGA1UdIwSBzDCByYAUO28HHLNHpOMWlJ8h",
  "WSSANCubp+6hgaWkgaIwgZ8xCzAJBgNVBAYTAkNBMRkwFwYDVQQIExBCcml0aXNo",
  "IENvbHVtYmlhMREwDwYDVQQHEwhWaWN0b3JpYTEVMBMGA1UEChMMTEUgU2Vydm8g",
  "Q28uMRYwFAYDVQQLEw1MRSBTZXJ2byBEcHQuMREwDwYDVQQDEwhEdW1teSBDQTEg",
  "MB4GCSqGSIb3DQEJARYRZHVtbXktY2FAdGVzdC5jb22CCQCXdmIUHxlAfjAMBgNV",
  "HRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4GBAIBRuEu/Fohz1BPcE2h+S4XiFHFN",
  "CGA+qWKo3A2GALHu8LyPzZ++mLqShFr87THnVgnmdFn45D2HlqVqCkI/MMk94DTl",
  "vE+aDWTkC93TwwHtcXHx8Hk5Pv0gT37tusDmchUJntQvbu5SWgIq1NNIyUT9DY8X",
  "Qa+dMBD1fXnxn2bG",
  "-----END CERTIFICATE-----\n"
].join("\n");

const DEFAULT_ROOT_CERT_KEY = [
  "-----BEGIN RSA PRIVATE KEY-----",
  "MIICXQIBAAKBgQDTE+BG5ovH/910cugCDJ44bDX5L66jy++upknCeK0VzxQxxrdr",
  "2xa1Mihx8wiHx+Dr9T2vxczl+Eb/XPh2rC4Z1+KJAfO4SgTpzwefeUByjJ2LpnAD",
  "01ohFqvoGmCQ3s85V7kh/xi7NyKAsXGYC5ePudnVxm5GdPsZ5jjaEJd2zwIDAQAB",
  "AoGBALo9QlksmE8KWnqh3EXankwIZoMMaFoL2dpOzKvzUDz67sWQoUxgDiQoMnmA",
  "R5mOac2oIBqUO1r5+qLchDopZ645YDuS256WLRlCAD/OrKGrxwt7crWpOEs9Plwc",
  "Ny0xfvTk4tUxJP2Pn7+1C7y676+tLquYcMiL9cufvq09wHcRAkEA76DyaJTgTrYW",
  "PWXdoyHGwlYDZYQCiMJyDlAG6pVSqebOuT1/eMCglcFEWORyGDGhOW1rtJekLhYi",
  "jwZbGFDkZwJBAOF/k9TsdRkFGWOXeCWV0UOg/rVtCvA+ULJQiAIPZ/FgHbYYGnKS",
  "WnVVLdtT0nKCOQ0QTdQRslJyn6HGlG5GGVkCQQCEz5xq8FCd73fGEcZUmuzRWuDJ",
  "C/BnofWbDym2LIrDVgQvUPFsmL6oIZTi+8JsvF0SOh4e2okJbgU7ZhdpE7RzAkBx",
  "T85VXEyrOei8Jsz09gel2CylthmdB3M9Z0Iw5tTwcb/8VLhVgj16YEcew0woxk8s",
  "xViWjB3zWC3m+QZ1MzxhAkBwYZG3MJr7KP2o4tHeeCvMETLjDNWUerx67MIIeKY5",
  "YDc1zPax41rmwLdMFbAplYjNHwTxEIrefEN1kROHOygE",
  "-----END RSA PRIVATE KEY-----\n"
].join("\n");

class CertificateService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    this.storage = options.storage;

    this.rootCertificate = PKI.certificateFromPem(options.rootCertPem || DEFAULT_ROOT_CERT_PEM);
    this.rootPrivateKey = PKI.privateKeyFromPem(options.rootCertKey || DEFAULT_ROOT_CERT_KEY);
  }

  find(query) {
    return this.storage.get("certificates").then((certificates) => {
      return certificates.find(query);
    });
  }

  filter(query) {
    return this.storage.get("certificates").then((certificates) => {
      return certificates.filter(query);
    });
  }

  get(id) {
    if (id === "root") {
      return Promise.resolve({
        id: "root",
        pem: PKI.certificateToPem(this.rootCertificate)
      });
    } else {
      return this.storage.get("certificates").then((certificates) => {
        return certificates.get(id);
      });
    }
  }

  getDer(id) {
    return this.get(id).then(({pem}) => {
      return ASN1.toDer(PKI.certificateToAsn1(PKI.certificateFromPem(pem)));
    });
  }

  create({orderId, status, pem, authorizationId, csr}) {
    return this.storage.get("certificates").then((certificates) => {
      return certificates.create(uuidV4()).then(({id}) => {
        return certificates.update(id, {orderId, status, pem, authorizationId, csr});
      });
    });
  }

  update(id, {orderId, status, pem, authorizationId, csr}) {
    return this.storage.get("certificates").then((certificates) => {
      return certificates.update(id, {orderId, status, pem, authorizationId, csr});
    });
  }

  sign(id) {
    return this.get(id).then(({csr}) => {
      return parseCsr(csr).then(({csr: parsedCsr, domains = []}) => {
        if (isEmpty(domains) || size(domains) > 1) {
          throw new Error("CSR must contain exactly 1 domain");
        } else {
          return {domain: domains[0], parsedCsr};
        }
      });
    }).then(({domain, parsedCsr}) => {
      const cert = PKI.createCertificate();

      cert.serialNumber = ForgeUtil.bytesToHex(ForgeRandom.getBytesSync(4));
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

      cert.setSubject([{ name: "commonName", value: domain }]);
      cert.setIssuer(this.rootCertificate.subject.attributes);
      cert.setExtensions([
        {name: "basicConstraints", cA: false},
        {name: "keyUsage", digitalSignature: true, keyEncipherment: true},
        {name: "extKeyUsage", serverAuth: true},
        {name: "subjectAltName", altNames: [{ type: 2, value: domain }]}
      ]);

      cert.publicKey = parsedCsr.publicKey;
      cert.sign(this.rootPrivateKey);

      return this.update(id, {
        pem: PKI.certificateToPem(cert)
      });
    });
  }
}

CertificateService.storageAttributes = {
  name: "certificates",
  attributes: [
    {name: "orderId", defaultValue: null},
    {name: "status", defaultValue: "pending"},
    {name: "pem", defaultValue: null},
    // Only v1 uses these because v1 doesn't have `order`
    {name: "authorizationId", defaultValue: null},
    {name: "csr", defaultValue: null}
  ]
};

export default CertificateService;
