import {expect} from "chai";
import sinon from "sinon";
import express from "express";
import bodyParser from "body-parser";
import Promise from "bluebird";
import request from "request-promise";

import updateAccount from "handlers/account/update-account.handler";

import {getRansomPort} from "../../helpers/server.helper";
import {async} from "../../helpers/test.helper";

describe("UpdateAccountHandler", () => {
  let sandbox;
  let port;
  let server;
  let serverReady;
  let accountService;
  let directoryService;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    port = getRansomPort();
    server = express();

    directoryService = {
      getFullUrl: (path) => `http://lalaland.com${path}`
    };

    accountService = {
      get: sandbox.stub()
    };

    server.use(bodyParser.json());
    server.use((req, _, next) => {
      req.__leServoFilters = {jose: {verifiedKey: {kid: "verified-key-42", alg: "some-alg"}}};
      next();
    });
    server.post("/accounts/:accound_id", updateAccount({accountService, directoryService}));

    serverReady = new Promise((resolve) => {
      server.listen(port, resolve);
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should respond with account JSON and location header", async(() => {
    accountService.get.returns(Promise.resolve({
      status: "valid",
      contact: ["mailto:lala@lalaland.com"],
      termsOfServiceAgreed: true,
      kid: "verified-key-42",
      id: "42"
    }));

    return serverReady
      .then(() => (
        request({
          uri: `http://localhost:${port}/accounts/42`,
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
});
