import {expect} from "chai";
import sinon from "sinon";
import express from "express";
import Promise from "bluebird";
import request from "request-promise";

import {GetNonceService} from "services/default.services";
import useNonce from "filters/use-nonce.filter";

import echo from "../helpers/echo.handler";
import {getRansomPort} from "../helpers/server.helper";
import {async} from "../helpers/test.helper";

describe("UseNonceFilter", () => {
  let sandbox;
  let service;
  let useNonceStub;
  let port;
  let server;
  let serverReady;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    service = GetNonceService();
    useNonceStub = sandbox.stub(service, "useNonce").returns(Promise.resolve());

    port = getRansomPort();
    server = express();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("with verified nonce", () => {
    beforeEach(() => {
      server.use((req, _, next) => {
        req.__leServoFilters = {jose: {verifiedNonce: "42"}};
        next();
      });
      server.use(useNonce);
      server.all("/*", echo);

      serverReady = new Promise((resolve) => {
        server.listen(port, resolve);
      });
    });

    it("should use verified nonce", async(() => (
      serverReady.then(() => (
        request({
          uri: `http://localhost:${port}/lala`,
          method: "GET"
        }).then(() => {
          expect(useNonceStub).to.have.been.calledOnce
            .and.to.have.been.calledWith("42");
        })
      ))
    )));
  });

  describe("without verified nonce", () => {
    beforeEach(() => {
      server.use(useNonce);
      server.all("/*", echo);

      serverReady = new Promise((resolve) => {
        server.listen(port, resolve);
      });
    });

    it("should not use nonce", async(() => (
      serverReady.then(() => (
        request({
          uri: `http://localhost:${port}/lala`,
          method: "GET"
        }).then(() => {
          expect(useNonceStub).to.have.not.been.called;
        })
      ))
    )));
  });
});
