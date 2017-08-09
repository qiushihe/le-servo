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
import {generateDummyRootCertificateAndKey} from "src/helpers/certificate.helper";

class CertificateService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    this.storage = options.storage;

    if (!isEmpty(options.rootCertPem) && !isEmpty(options.rootCertKey)) {
      this.rootCertificate = PKI.certificateFromPem(options.rootCertPem);
      this.rootPrivateKey = PKI.privateKeyFromPem(options.rootCertKey);
    } else {
      const {
        pem: dummyPem,
        key: dummyKey
      } = generateDummyRootCertificateAndKey();
      this.rootCertificate = PKI.certificateFromPem(dummyPem);
      this.rootPrivateKey = PKI.privateKeyFromPem(dummyKey);
    }
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
