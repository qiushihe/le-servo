import Promise from "bluebird";

import InternalDBService from "src/services/storage/internaldb.service";
import AccountService from "src/services/account.service";

import {async} from "test/helpers/test.helper";

describe("AccountService", () => {
  let sandbox;
  let service;
  let joseService;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    joseService = {
      addKey: sandbox.stub().returns(Promise.resolve())
    };

    service = new AccountService({
      joseService,
      storage: new InternalDBService({
        records: [{...AccountService.storageAttributes}]
      })
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#find()", () => {
    beforeEach(() => {
      service.storage.collections.accounts.records["lala42"] = {
        id: "lala42",
        status: "valid",
        contact: ["lala@lalaland.com"],
        termsOfServiceAgreed: true,
        kid: "key-42"
      };
    });

    it("should find account with matching query", async(() => (
      service.find({kid: "key-42"}).then((account) => {
        expect(account).to.have.property("id", "lala42");
        expect(account).to.have.property("kid", "key-42");
      })
    )));

    it("should not find account with mis-matching query", async(() => (
      service.find({kid: "key-41"}).then((account) => {
        expect(account).to.be.null;
      })
    )));
  });

  describe("#get()", () => {
    beforeEach(() => {
      service.storage.collections.accounts.records["lala42"] = {
        id: "lala42",
        status: "valid",
        contact: ["lala@lalaland.com"],
        termsOfServiceAgreed: true,
        kid: "key-42"
      };
    });

    it("should return account with matching id", async(() => (
      service.get("lala42").then((account) => {
        expect(account).to.have.property("id", "lala42");
        expect(account).to.have.property("kid", "key-42");
      })
    )));

    it("should not return account with mis-matching id", async(() => (
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
    it("should create new account", async(() => (
      service.create({
        termsOfServiceAgreed: true,
        contact: [
          "mailto:lala@lalaland.com"
        ],
        key: {kid: "key-42"}
      })
      .then((account) => {
        expect(account).to.have.property("id");
        expect(account).to.have.property("kid", "key-42");
        expect(service.joseService.addKey).to.have.been.calledOnce
          .and.to.have.been.calledWith(sinon.match.has("kid", "key-42"));
      })
    )));
  });

  describe("#update()", () => {
    beforeEach(() => {
      service.storage.collections.accounts.records["lala42"] = {
        id: "lala42",
        status: "valid",
        contact: ["lala@lalaland.com"],
        termsOfServiceAgreed: false,
        kid: "key-42"
      };
    });

    it("should update existing account", async(() => (
      service.update("lala42", {
        termsOfServiceAgreed: true,
        contact: ["mailto:lala2@lalaland.com"]
      })
      .then((account) => {
        expect(account).to.have.property("id", "lala42");
        expect(account).to.have.property("termsOfServiceAgreed", true);
        expect(account.contact).to.deep.equal(["mailto:lala2@lalaland.com"]);
      })
    )));
  });
});
