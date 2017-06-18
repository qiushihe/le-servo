import {expect} from "chai";
import Promise from "bluebird";
import request from "request-promise";

import updateAccount from "handlers/account/update-account.handler";

import {getServer} from "../../helpers/server.helper";
import {async} from "../../helpers/test.helper";

describe("UpdateAccountHandler", () => {
  let sandbox;
  let server;
  let dummyAccount;
  let accountService;
  let directoryService;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    dummyAccount = {
      status: "valid",
      contact: ["mailto:lala@lalaland.com"],
      termsOfServiceAgreed: false,
      kid: "verified-key-42",
      id: "42"
    };

    directoryService = {
      getFullUrl: (path) => `http://lalaland.com${path}`
    };

    accountService = {
      get: (_) => Promise.resolve({...dummyAccount}),
      update: (_, payload) => Promise.resolve({...dummyAccount, ...payload}),
      deactivate: (_) => Promise.resolve({...dummyAccount, status: "deactivated"})
    };

    sandbox.spy(accountService, "update");
    sandbox.spy(accountService, "deactivate");

    server = getServer({
      parser: "json",
      setup: (server) => {
        server.use((req, _, next) => {
          req.__leServoFilters = {jose: {verifiedKey: {kid: "verified-key-42", alg: "some-alg"}}};
          next();
        });
        server.post("/accounts/:accound_id", updateAccount({accountService, directoryService}));
      }
    });
  });

  afterEach((done) => {
    sandbox.restore();
    server.close(done);
  });

  it("should respond with account JSON and location header", async(() => {
    return server.getReady()
      .then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/accounts/42`,
          method: "POST",
          json: true,
          body: {},
          resolveWithFullResponse: true
        })
      ))
      .then((res) => {
        expect(res.headers).to.have.property("location", "http://lalaland.com/accounts/42");
        expect(res.body).to.have.property("status", "valid");
        expect(res.body).to.have.property("contact");
        expect(res.body.contact).to.deep.equal(["mailto:lala@lalaland.com"]);
        expect(res.body).to.have.property("terms-of-service-agreed", false);
        expect(res.body).to.have.property("orders");
        expect(res.body.orders).to.match(/^http/);
      });
  }));

  it("should call account service to update account", async(() => {
    return server.getReady()
      .then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/accounts/42`,
          method: "POST",
          json: true,
          body: {
            "terms-of-service-agreed": true,
            "contact": ["mailto:lala2@lalaland.com"]
          }
        })
      ))
      .then((res) => {
        expect(accountService.update).to.have.been.calledOnce;
        expect(res.contact).to.deep.equal(["mailto:lala2@lalaland.com"]);
        expect(res).to.have.property("terms-of-service-agreed", true);
      });
  }));

  it("should call account service to deactivate account", async(() => {
    return server.getReady()
      .then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/accounts/42`,
          method: "POST",
          json: true,
          body: {
            "status": "deactivated"
          }
        })
      ))
      .then((res) => {
        expect(accountService.deactivate).to.have.been.calledOnce
          .and.to.have.been.calledWith("42");
        expect(res).to.have.property("status", "deactivated");
      });
  }));

  it("should not accept account with mis-matching key", async(() => {
    dummyAccount.kid = "a-different-key-42";

    return server.getReady()
      .then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/accounts/42`,
          method: "POST",
          json: true,
          body: {"contact": ["mailto:lala2@lalaland.com"]}
        })
      ))
      .then(() => {
        const err = new Error("Should not accept account with mis-matching key");
        err._rethrow = true;
        throw err;
      })
      .catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err).to.have.property("statusCode", 401);
        expect(err).to.have.property("message", "401 - \"Account key mis-match\"");
      });
  }));

  it("should not accept deactivated account", async(() => {
    dummyAccount.status = "deactivated";

    return server.getReady()
      .then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/accounts/42`,
          method: "POST",
          json: true,
          body: {"contact": ["mailto:lala2@lalaland.com"]}
        })
      ))
      .then(() => {
        const err = new Error("Should not accept deactivated account");
        err._rethrow = true;
        throw err;
      })
      .catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err).to.have.property("statusCode", 403);
        expect(err).to.have.property("message", "403 - \"Account deactivated\"");
      });
  }));
});
