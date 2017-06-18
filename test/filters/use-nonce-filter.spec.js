import Promise from "bluebird";
import request from "request-promise";

import NonceService from "src/services/nonce.service";
import useNonce from "src/filters/use-nonce.filter";

import echo from "test/helpers/echo.handler";
import {getServer} from "test/helpers/server.helper";
import {async} from "test/helpers/test.helper";

describe("UseNonceFilter", () => {
  let sandbox;
  let service;
  let useNonceStub;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    service = new NonceService({bufferSize: 32});
    useNonceStub = sandbox.stub(service, "useNonce").returns(Promise.resolve());
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("with verified nonce", () => {
    let server;

    beforeEach(() => {
      server = getServer({
        parser: "json",
        setup: (server) => {
          server.use((req, _, next) => {
            req.__leServoFilters = {jose: {verifiedNonce: "42"}};
            next();
          });
          server.use(useNonce({nonceService: service}));
          server.all("/*", echo);
        }
      });
    });

    afterEach((done) => {
      server.close(done);
    });

    it("should use verified nonce", async(() => (
      server.getReady().then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/lala`,
          method: "GET"
        }).then(() => {
          expect(useNonceStub).to.have.been.calledOnce
            .and.to.have.been.calledWith("42");
        })
      ))
    )));
  });

  describe("without verified nonce", () => {
    let server;

    beforeEach(() => {
      server = getServer({
        parser: "json",
        setup: (server) => {
          server.use(useNonce({nonceService: service}));
          server.all("/*", echo);
        }
      });
    });

    afterEach((done) => {
      server.close(done);
    });

    it("should not use nonce", async(() => (
      server.getReady().then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/lala`,
          method: "GET"
        }).then(() => {
          expect(useNonceStub).to.have.not.been.called;
        })
      ))
    )));
  });
});
