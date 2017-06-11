import chai, {expect} from "chai";
import sinon, {match} from "sinon";
import sinonChai from "sinon-chai";
import express from "express";
import Promise from "bluebird";
import request from "request-promise";

import NonceService from "services/nonce.service";
import newNonce from "filters/new-nonce.filter";

import echo from "../helpers/echo.handler";
import {getRansomPort} from "../helpers/server.helper";
import {async} from "../helpers/test.helper";

chai.use(sinonChai);

describe("NewNonceFilter", () => {
  let sandbox;
  let service;
  let port;
  let server;
  let handler;
  let serverReady;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    service = new NonceService({bufferSize: 32});

    port = getRansomPort();
    server = express();
    handler = sandbox.spy(echo);

    server.use(newNonce({nonceService: service}));
    server.all("/*", handler);

    serverReady = new Promise((resolve) => {
      server.listen(port, resolve);
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should add replay-nonce header to GET responses", async(() => (
    serverReady.then(() => (
      request({
        uri: `http://localhost:${port}/lala`,
        method: "GET"
      }).then(() => {
        expect(handler).to.have.been.calledOnce;
        expect(handler.getCall(0).args[1].getHeader("replay-nonce")).to.be.ok
          .and.to.not.be.empty;
      })
    ))
  )));

  it("should add replay-nonce header to POST responses", async(() => (
    serverReady.then(() => (
      request({
        uri: `http://localhost:${port}/lala`,
        method: "POST",
        body: "LALA"
      }).then(() => {
        expect(handler).to.have.been.calledOnce;
        expect(handler.getCall(0).args[1].getHeader("replay-nonce")).to.be.ok
          .and.to.not.be.empty;
      })
    ))
  )));

  it("should add replay-nonce header to PUT responses", async(() => (
    serverReady.then(() => (
      request({
        uri: `http://localhost:${port}/lala`,
        method: "PUT",
        body: "LALA"
      }).then(() => {
        expect(handler).to.have.been.calledOnce;
        expect(handler.getCall(0).args[1].getHeader("replay-nonce")).to.be.ok
          .and.to.not.be.empty;
      })
    ))
  )));
});
