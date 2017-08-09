import InternalDBService from "src/services/storage/internaldb.service";
import ChallengeService from "src/services/challenge.service";

import {async} from "test/helpers/test.helper";

describe("ChallengeService", () => {
  let service;

  beforeEach(() => {
    service = new ChallengeService({
      storage: new InternalDBService({
        records: [{...ChallengeService.storageAttributes}]
      })
    });
  });

  describe("#find()", () => {
    beforeEach(() => {
      service.storage.collections.challenges.records["lala42"] = {
        id: "lala42",
        authorizationId: "authorization42",
        status: "pending"
      };
    });

    it("should find challenge with matching query", async(() => (
      service.find({authorizationId: "authorization42"}).then((challenge) => {
        expect(challenge).to.have.property("id", "lala42");
        expect(challenge).to.have.property("authorizationId", "authorization42");
      })
    )));

    it("should not find challenge with mis-matching query", async(() => (
      service.find({authorizationId: "authorization41"}).then((challenge) => {
        expect(challenge).to.be.null;
      })
    )));
  });

  describe("#get()", () => {
    beforeEach(() => {
      service.storage.collections.challenges.records["lala42"] = {
        id: "lala42",
        authorizationId: "authorization42",
        status: "pending"
      };
    });

    it("should return challenge with matching id", async(() => (
      service.get("lala42").then((challenge) => {
        expect(challenge).to.have.property("id", "lala42");
        expect(challenge).to.have.property("authorizationId", "authorization42");
      })
    )));

    it("should not return challenge with mis-matching id", async(() => (
      service.get("lala43").then(() => {
        const err = new Error("Promise should not resolve with mis-matching id");
        err._rethrow = true;
        throw err;
      })
      .catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err).to.have.property("message", "Record not found with id: lala43");
      })
    )));
  });

  describe("#create()", () => {
    it("should create new challenge", async(() => (
      service.create({
        authorizationId: "authorization42", type: "http-01", token: "token42"
      })
      .then((challenge) => {
        expect(challenge).to.have.property("id");
        expect(challenge).to.have.property("authorizationId", "authorization42");
        expect(challenge).to.have.property("type", "http-01");
        expect(challenge).to.have.property("token", "token42");
      })
    )));
  });

  describe("#update()", () => {
    beforeEach(() => {
      service.storage.collections.challenges.records["lala42"] = {
        id: "lala42",
        authorizationId: "authorization42",
        status: "pending"
      };
    });

    it("should update existing challenge", async(() => (
      service.update("lala42", {
        status: "valid"
      })
      .then((challenge) => {
        expect(challenge).to.have.property("id", "lala42");
        expect(challenge).to.have.property("status", "valid");
      })
    )));
  });
});
