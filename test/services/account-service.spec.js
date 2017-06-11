import chai, {expect} from "chai";
import sinon, {match} from "sinon";
import sinonChai from "sinon-chai";
import Promise from "bluebird";

import JoseService from "services/jose.service";
import CollectionService from "services/collection.service";
import AccountService from "services/account.service";

import {async} from "../helpers/test.helper";

chai.use(sinonChai);

describe("AccountService", () => {
  let sandbox;
  let service;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    service = new AccountService({
      joseService: new JoseService(),
      storage: new CollectionService({
        records: [{
          name: "accounts",
          attributes: [
            {name: "status", defaultValue: "valid"},
            {name: "contact", defaultValue: []},
            {name: "termsOfServiceAgreed", defaultValue: false},
            {name: "kid", defaultValue: null}
          ]
        }]
      })
    });

    sandbox.stub(service.joseService, "addKey").returns(Promise.resolve());
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
          .and.to.have.been.calledWith(match.has("kid", "key-42"));
      })
    )));
  });
});
