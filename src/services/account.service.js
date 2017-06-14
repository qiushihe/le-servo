import Promise from "bluebird";
import uuidV4 from "uuid/v4";

class AccountService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    if (!options.joseService) {
      throw new Error("Missing jose service");
    }

    this.storage = options.storage;
    this.joseService = options.joseService;
  }

  find(query) {
    return this.storage.get("accounts").then((accounts) => {
      return accounts.find(query);
    });
  }

  get(id) {
    return this.storage.get("accounts").then((accounts) => {
      return accounts.get(id);
    });
  }

  create({termsOfServiceAgreed, contact, key}) {
    return this.storage.get("accounts").then((accounts) => {
      return accounts.create(uuidV4())
        .then(({id}) => {
          return accounts.update(id, {
            termsOfServiceAgreed,
            contact,
            kid: key.kid
          });
        })
        .then((account) => {
          return this.joseService.addKey(key)
            .then(() => {
              return account;
            });
        });
    });
  }

  update(id, {contact, termsOfServiceAgreed}) {
    return this.storage.get("accounts").then((accounts) => {
      return accounts.update(id, {contact, termsOfServiceAgreed});
    });
  }

  deactivate(id) {
    return this.storage.get("accounts").then((accounts) => {
      return accounts.update(id, {status: "deactivated"});
    });
  }
}

export default AccountService;
