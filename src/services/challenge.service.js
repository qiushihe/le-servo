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

  get(id) {
    return this.storage.get("challenges").then((challenges) => {
      return challenges.get(id);
    });
  }

  create({authorizationId, type, url, status, keyAuthorization}) {
    return this.storage.get("challenges").then((challenges) => {
      return challenges.create(uuidV4()).then(({id}) => {
        return challenges.update(id, {authorizationId, type, url, status, keyAuthorization});
      });
    });
  }

  update(id, {status, validated, error}) {
    return this.storage.get("challenges").then((challenges) => {
      return challenges.update(id, {status, validated, error});
    });
  }
}

ChallengeService.storageAttributes = {
  name: "challenges",
  attributes: [
    {name: "authorizationId", defaultValue: null},
    {name: "type", defaultValue: null},
    {name: "url", defaultValue: null},
    {name: "status", defaultValue: "pending"},
    {name: "validated", defaultValue: null},
    {name: "keyAuthorization", defaultValue: null},
    {name: "error", defaultValue: null}
  ]
};

export default ChallengeService;
