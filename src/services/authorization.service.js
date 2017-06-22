import uuidV4 from "uuid/v4";

class AuthorizationService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    this.storage = options.storage;
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

  create({orderId, identifierType, identifierValue, status, expires, token}) {
    // TODO: Create HTTP challange

    return this.storage.get("authorizations").then((authorizations) => {
      return authorizations.create(uuidV4()).then(({id}) => {
        return authorizations.update(id, {
          orderId, identifierType, identifierValue, status, expires, token
        });
      });
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
    {name: "expires", defaultValue: null},
    {name: "token", defaultValue: null}
  ]
};

export default AuthorizationService;
