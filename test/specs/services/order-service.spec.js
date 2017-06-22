import Promise from "bluebird";

import CollectionService from "src/services/collection.service";
import OrderService from "src/services/order.service";

import {async} from "test/helpers/test.helper";

import lalaDotCom from "test/fixtures/csr-base64url/lala.com";

describe("OrderService", () => {
  let sandbox;
  let service;
  let authorizationService;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    authorizationService = {
      create: sandbox.stub().returns(Promise.resolve())
    };

    service = new OrderService({
      authorizationService,
      storage: new CollectionService({
        records: [{
          name: "orders",
          attributes: [
            {name: "accountId", defaultValue: null},
            {name: "status", defaultValue: "pending"},
            {name: "expires", defaultValue: null},
            {name: "csr", defaultValue: null},
            {name: "notBefore", defaultValue: null},
            {name: "notAfter", defaultValue: null},
            {name: "error", defaultValue: null}
          ]
        }]
      })
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#find()", () => {
    beforeEach(() => {
      service.storage.collections.orders.records["lala42"] = {
        id: "lala42",
        accountId: "account42",
        status: "pending"
      };
    });

    it("should find order with matching query", async(() => (
      service.find({accountId: "account42"}).then((order) => {
        expect(order).to.have.property("id", "lala42");
        expect(order).to.have.property("accountId", "account42");
      })
    )));

    it("should not find order with mis-matching query", async(() => (
      service.find({accountId: "account41"}).then((order) => {
        expect(order).to.be.null;
      })
    )));
  });

  describe("#get()", () => {
    beforeEach(() => {
      service.storage.collections.orders.records["lala42"] = {
        id: "lala42",
        accountId: "account42",
        status: "pending"
      };
    });

    it("should return order with matching id", async(() => (
      service.get("lala42").then((order) => {
        expect(order).to.have.property("id", "lala42");
        expect(order).to.have.property("accountId", "account42");
      })
    )));

    it("should not return order with mis-matching id", async(() => (
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
    it("should create new order", async(() => (
      service.create({
        accountId: "account42",
        csr: lalaDotCom
      })
      .then((order) => {
        expect(order).to.have.property("id");
        expect(order).to.have.property("accountId", "account42");
        expect(service.authorizationService.create).to.have.been.calledOnce
          .and.to.have.been.calledWith(sinon.match({
            orderId: sinon.match.string,
            token: sinon.match.string,
            identifierValue: "lala.com"
          }));
      })
    )));
  });

  describe("#update()", () => {
    beforeEach(() => {
      service.storage.collections.orders.records["lala42"] = {
        id: "lala42",
        accountId: "account42",
        status: "pending"
      };
    });

    it("should update existing order", async(() => (
      service.update("lala42", {
        status: "valid"
      })
      .then((order) => {
        expect(order).to.have.property("id", "lala42");
        expect(order).to.have.property("status", "valid");
      })
    )));
  });
});
