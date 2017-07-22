import uuidV4 from "uuid/v4";

class ChallengeService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    this.storage = options.storage;
  }

  find(query) {
    return this.storage.get("challenges").then((challenges) => {
      return challenges.find(query);
    });
  }

  filter(query) {
    return this.storage.get("challenges").then((challenges) => {
      return challenges.filter(query);
    });
  }

  get(id) {
    return this.storage.get("challenges").then((challenges) => {
      return challenges.get(id);
    });
  }

  create({authorizationId, type, status, token}) {
    return this.storage.get("challenges").then((challenges) => {
      return challenges.create(uuidV4()).then(({id}) => {
        return challenges.update(id, {authorizationId, type, status, token});
      });
    });
  }

  update(id, {status, validated, error, keyAuthorization}) {
    return this.storage.get("challenges").then((challenges) => {
      return challenges.update(id, {status, validated, error, keyAuthorization});
    });
  }
}

ChallengeService.storageAttributes = {
  name: "challenges",
  attributes: [
    {name: "authorizationId", defaultValue: null},
    {name: "type", defaultValue: null},
    {name: "status", defaultValue: "pending"},
    {name: "validated", defaultValue: null},
    {name: "token", defaultValue: null},
    {name: "error", defaultValue: null},
    {name: "keyAuthorization", defaultValue: null}
  ]
};

export default ChallengeService;
