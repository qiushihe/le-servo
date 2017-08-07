import uuidV4 from "uuid/v4";

class CertificateService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    this.storage = options.storage;
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
    return this.storage.get("certificates").then((certificates) => {
      return certificates.get(id);
    });
  }

  create({orderId, status, authorizationId, csr}) {
    return this.storage.get("certificates").then((certificates) => {
      return certificates.create(uuidV4()).then(({id}) => {
        return certificates.update(id, {orderId, status, authorizationId, csr});
      });
    });
  }

  update(id, {orderId, status, authorizationId, csr}) {
    return this.storage.get("certificates").then((certificates) => {
      return certificates.update(id, {orderId, status, authorizationId, csr});
    });
  }
}

CertificateService.storageAttributes = {
  name: "certificates",
  attributes: [
    {name: "orderId", defaultValue: null},
    {name: "status", defaultValue: "pending"},
    // Only v1 uses these because v1 doesn't have `order`
    {name: "authorizationId", defaultValue: null},
    {name: "csr", defaultValue: null}
  ]
};

export default CertificateService;
