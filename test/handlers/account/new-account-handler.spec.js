import Promise from "bluebird";
import request from "request-promise";

import newAccount from "handlers/account/new-account.handler";

import {getServer} from "../../helpers/server.helper";
import {async} from "../../helpers/test.helper";

describe("NewAccountHandler", () => {
  let sandbox;
  let directoryService;
  let accountService;
  let server;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    directoryService = {
      getFullUrl: (path) => `http://lalaland.com${path}`
    };

    accountService = {
      find: sandbox.stub(),
      create: sandbox.stub()
    };

    server = getServer({
      parser: "json",
      setup: (server) => {
        server.use((req, _, next) => {
          req.__leServoFilters = {jose: {verifiedKey: {kid: "verified-key-42", alg: "some-alg"}}};
          next();
        });
        server.post("/new-account", newAccount({directoryService, accountService}));
      }
    });
  });

  afterEach((done) => {
    sandbox.restore();
    server.close(done);
  });

  it("should call account service to create account", async(() => {
    accountService.find.returns(Promise.resolve(null));
    accountService.create.returns(Promise.resolve({id: "42"}));

    return server.getReady()
      .then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/new-account`,
          method: "POST",
          json: true,
          body: {
            "terms-of-service-agreed": true,
            "contact": ["mailto:lala@lalaland.com"]
          }
        })
      ))
      .then(() => {
        expect(accountService.create).to.have.been.calledOnce;
        expect(accountService.create)
          .to.have.been.calledWith(sinon.match.has("termsOfServiceAgreed", true));
        expect(accountService.create)
          .to.have.been.calledWith(sinon.match.has("contact", ["mailto:lala@lalaland.com"]));
        expect(accountService.create)
          .to.have.been.calledWith(
            sinon.match.has("key", sinon.match.has("kid", "verified-key-42"))
          );
      });
  }));

  it("should respond with account JSON and location header", async(() => {
    accountService.find.returns(Promise.resolve({
      status: "valid",
      contact: ["mailto:lala@lalaland.com"],
      termsOfServiceAgreed: true,
      kid: "verified-key-42",
      id: "42"
    }));

    return server.getReady()
      .then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/new-account`,
          method: "POST",
          json: true,
          body: {
            "terms-of-service-agreed": true,
            "contact": ["mailto:lala@lalaland.com"]
          },
          resolveWithFullResponse: true
        })
      ))
      .then((res) => {
        expect(res.headers).to.have.property("location", "http://lalaland.com/accounts/42");
        expect(res.body).to.have.property("status", "valid");
        expect(res.body).to.have.property("contact");
        expect(res.body.contact).to.deep.equal(["mailto:lala@lalaland.com"]);
        expect(res.body).to.have.property("terms-of-service-agreed", true);
        expect(res.body).to.have.property("orders");
        expect(res.body.orders).to.match(/^http/);
      });
  }));

  it("should respond with 404 when no account is found with only-return-existing", async(() => {
    accountService.find.returns(Promise.resolve(null));
    return server.getReady()
      .then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/new-account`,
          method: "POST",
          json: true,
          body: {
            "only-return-existing": true
          },
          resolveWithFullResponse: true
        })
      ))
      .then(() => {
        const err = new Error("Request should not be successful");
        err._rethrow = true;
        throw err;
      })
      .catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err).to.have.property("statusCode", 404);
      });
  }));
});
