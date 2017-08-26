import uuidV4 from "uuid/v4";
import Promise from "bluebird";
import moment from "moment";

// TODO: Implement worker to update status of expired authorizations

class AuthorizationService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    if (!options.challengeService) {
      throw new Error("Missing challenge service");
    }

    this.storage = options.storage;
    this.challengeService = options.challengeService;
  }

  find(query) {
    return this.storage.get("authorizations").then((authorizations) => {
      return authorizations.find(query);
    });
  }

  filter(query) {
    return this.storage.get("authorizations").then((authorizations) => {
      return authorizations.filter(query);
    });
  }

  get(id) {
    return this.storage.get("authorizations").then((authorizations) => {
      return authorizations.get(id);
    });
  }

  create({accountId, orderId, identifierType, identifierValue, status, expires}) {
    return this.storage.get("authorizations").then((authorizations) => {
      return authorizations.create(uuidV4()).then(({id}) => {
        return authorizations.update(id, {
          accountId, orderId, identifierType, identifierValue, status, expires
        });
      });
    }).then((authorization) => {
      return Promise.all([
        this.challengeService.create({
          authorizationId: authorization.id,
          type: "tls-sni-01",
          token: uuidV4().replace(/-/g, "")
        })
      ]).then(() => authorization);
    });
  }

  update(id, {status, csr}) {
    return this.storage.get("authorizations").then((authorizations) => {
      return authorizations.update(id, {status, csr});
    });
  }
}

AuthorizationService.storageAttributes = {
  name: "authorizations",
  attributes: [
    {name: "accountId", defaultValue: null},
    {name: "orderId", defaultValue: null},
    {name: "identifierType", defaultValue: "dns"},
    {name: "identifierValue", defaultValue: null},
    {name: "status", defaultValue: "pending"},
    {name: "expires", defaultValue: () => moment().add(1, "day").toDate()},
    // Used by v1 only because v1 doesn't have "order"
    {name: "csr", defaultValue: null}
  ]
};

export default AuthorizationService;
