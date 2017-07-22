import Promise from "bluebird";

import CollectionService from "src/services/collection.service";
import AuthorizationService from "src/services/authorization.service";

import {async} from "test/helpers/test.helper";

describe("AuthorizationService", () => {
  let sandbox;
  let service;
  let challengeService;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    challengeService = {
      create: sandbox.stub().returns(Promise.resolve())
    };

    service = new AuthorizationService({
      challengeService,
      storage: new CollectionService({
        records: [{...AuthorizationService.storageAttributes}]
      })
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#find()", () => {
    beforeEach(() => {
      service.storage.collections.authorizations.records["lala42"] = {
        id: "lala42",
        orderId: "order666",
        status: "pending"
      };
    });

    it("should find authorization with matching query", async(() => (
      service.find({orderId: "order666"}).then((authorization) => {
        expect(authorization).to.have.property("id", "lala42");
        expect(authorization).to.have.property("orderId", "order666");
      })
    )));

    it("should not find authorization with mis-matching query", async(() => (
      service.find({orderId: "order42"}).then((authorization) => {
        expect(authorization).to.be.null;
      })
    )));
  });

  describe("#get()", () => {
    beforeEach(() => {
      service.storage.collections.authorizations.records["lala42"] = {
        id: "lala42",
        orderId: "order666",
        status: "pending"
      };
    });

    it("should return authorization with matching id", async(() => (
      service.get("lala42").then((authorization) => {
        expect(authorization).to.have.property("id", "lala42");
        expect(authorization).to.have.property("orderId", "order666");
      })
    )));

    it("should not return authorization with mis-matching id", async(() => (
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
    it("should create new authorization", async(() => (
      service.create({
        orderId: "order666", identifierValue: "lala.com"
      })
      .then((authorization) => {
        expect(authorization).to.have.property("id");
        expect(authorization).to.have.property("orderId", "order666");
        expect(authorization).to.have.property("identifierValue", "lala.com");
        expect(service.challengeService.create).to.have.been.calledOnce
          .and.to.have.been.calledWith(sinon.match({
            authorizationId: authorization.id,
            type: sinon.match.string,
            token: sinon.match.string
          }));
      })
    )));
  });

  describe("#update()", () => {
    beforeEach(() => {
      service.storage.collections.authorizations.records["lala42"] = {
        id: "lala42",
        accountId: "account42",
        status: "pending"
      };
    });

    it("should update existing authorization", async(() => (
      service.update("lala42", {
        status: "valid"
      })
      .then((authorization) => {
        expect(authorization).to.have.property("id", "lala42");
        expect(authorization).to.have.property("status", "valid");
      })
    )));
  });
});
