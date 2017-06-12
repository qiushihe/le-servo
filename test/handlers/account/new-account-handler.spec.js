import chai, {expect} from "chai";
import sinon, {match} from "sinon";
import sinonChai from "sinon-chai";
import express from "express";
import bodyParser from "body-parser";
import Promise from "bluebird";
import request from "request-promise";

import newAccount from "handlers/account/new-account.handler";

import {getRansomPort} from "../../helpers/server.helper";
import {async} from "../../helpers/test.helper";

chai.use(sinonChai);

describe("NewAccountHandler", () => {
  let sandbox;
  let directoryService;
  let accountService;
  let port;
  let server;
  let serverReady;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    directoryService = {
      getFullUrl: (path) => `http://lalaland.com${path}`
    };

    accountService = {
      find: sandbox.stub(),
      create: sandbox.stub()
    };

    port = getRansomPort();
    server = express();

    server.use(bodyParser.json());
    server.use((req, _, next) => {
      req.__leServoFilters = {jose: {verifiedKey: {kid: "verified-key-42", alg: "some-alg"}}};
      next();
    });
    server.post("/new-account", newAccount({directoryService, accountService}));

    serverReady = new Promise((resolve) => {
      server.listen(port, resolve);
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should call account service to create account", async(() => {
    accountService.find.returns(Promise.resolve(null));
    accountService.create.returns(Promise.resolve({id: "42"}));

    return serverReady
      .then(() => (
        request({
          uri: `http://localhost:${port}/new-account`,
          method: "POST",
          json: true,
          body: {
            "terms-of-service-agreed": true,
            "contact": ["mailto:lala@lalaland.com"]
          }
        })
      ))
      .then((res) => {
        expect(accountService.create).to.have.been.calledOnce;
        expect(accountService.create)
          .to.have.been.calledWith(match.has("termsOfServiceAgreed", true));
        expect(accountService.create)
          .to.have.been.calledWith(match.has("contact", ["mailto:lala@lalaland.com"]));
        expect(accountService.create)
          .to.have.been.calledWith(match.has("key", match.has("kid", "verified-key-42")));
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

    return serverReady
      .then(() => (
        request({
          uri: `http://localhost:${port}/new-account`,
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
    return serverReady
      .then(() => (
        request({
          uri: `http://localhost:${port}/new-account`,
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
  }))
});
