import uuidV4 from "uuid/v4";

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

  get(id) {
    return this.storage.get("authorizations").then((authorizations) => {
      return authorizations.get(id);
    });
  }

  create({orderId, identifierType, identifierValue, status, expires}) {
    return this.storage.get("authorizations").then((authorizations) => {
      return authorizations.create(uuidV4()).then(({id}) => {
        return authorizations.update(id, {
          orderId, identifierType, identifierValue, status, expires
        });
      });
    }).then((authorization) => {
      return this.challengeService.create({
        authorizationId: authorization.id,
        type: "http-01",
        token: uuidV4().replace(/-/g, "")
      })
      .then(() => authorization);
    });
  }

  update(id, {status}) {
    return this.storage.get("authorizations").then((authorizations) => {
      return authorizations.update(id, {status});
    });
  }
}

AuthorizationService.storageAttributes = {
  name: "authorizations",
  attributes: [
    {name: "orderId", defaultValue: null},
    {name: "identifierType", defaultValue: "dns"},
    {name: "identifierValue", defaultValue: null},
    {name: "status", defaultValue: "pending"},
    {name: "expires", defaultValue: null}
  ]
};

export default AuthorizationService;
