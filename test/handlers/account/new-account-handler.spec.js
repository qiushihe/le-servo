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
  let accountService;
  let port;
  let server;
  let serverReady;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    accountService = {
      create: sandbox.stub()
    };

    port = getRansomPort();
    server = express();

    server.use(bodyParser.json());
    server.use((req, _, next) => {
      req.__leServoFilters = {jose: {verifiedKey: {kid: "verified-key-42", alg: "some-alg"}}};
      next();
    });
    server.post("/new-account", newAccount({accountService}));

    serverReady = new Promise((resolve) => {
      server.listen(port, resolve);
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should call account service to create account", async(() => {
    const header = {nonce: "42", url: "http://lala.land/lala"};
    const payload = {
      "terms-of-service-agreed": true,
      "contact": ["mailto:lala@lalaland.com"]
    };

    accountService.create.returns(Promise.resolve({
      id: "42"
    }));

    return serverReady
      .then(() => (
        request({
          uri: `http://localhost:${port}/new-account`,
          method: "POST",
          json: true,
          body: payload
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

  it("should serialize account in JSON response", async(() => {
    const header = {nonce: "42", url: "http://lala.land/lala"};
    const payload = {
      "terms-of-service-agreed": true,
      "contact": ["mailto:lala@lalaland.com"]
    };

    accountService.create.returns(Promise.resolve({
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
          body: payload
        })
      ))
      .then((res) => {
        expect(res).to.have.property("status", "valid");
        expect(res).to.have.property("contact");
        expect(res.contact).to.deep.equal(["mailto:lala@lalaland.com"]);
        expect(res).to.have.property("terms-of-service-agreed", true);
        expect(res).to.have.property("orders");
        expect(res.orders).to.match(/^http/);
      });
  }));
});
