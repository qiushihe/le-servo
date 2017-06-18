import request from "request-promise";

import NonceService from "services/nonce.service";
import newNonce from "filters/new-nonce.filter";

import echo from "../helpers/echo.handler";
import {getServer} from "../helpers/server.helper";
import {async} from "../helpers/test.helper";

describe("NewNonceFilter", () => {
  let sandbox;
  let service;
  let server;
  let handler;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    service = new NonceService({bufferSize: 32});

    handler = sandbox.spy(echo);

    server = getServer({
      parser: "json",
      setup: (server) => {
        server.use(newNonce({nonceService: service}));
        server.all("/*", handler);
      }
    });
  });

  afterEach((done) => {
    sandbox.restore();
    server.close(done);
  });

  it("should add replay-nonce header to GET responses", async(() => (
    server.getReady().then(() => (
      request({
        uri: `http://localhost:${server.getPort()}/lala`,
        method: "GET"
      }).then(() => {
        expect(handler).to.have.been.calledOnce;
        expect(handler.getCall(0).args[1].getHeader("replay-nonce")).to.be.ok
          .and.to.not.be.empty;
      })
    ))
  )));

  it("should add replay-nonce header to POST responses", async(() => (
    server.getReady().then(() => (
      request({
        uri: `http://localhost:${server.getPort()}/lala`,
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
    server.getReady().then(() => (
      request({
        uri: `http://localhost:${server.getPort()}/lala`,
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
