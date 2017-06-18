import {JWK} from "node-jose";
import request from "request-promise";

import JoseService from "services/jose.service";
import joseVerify from "filters/jose-verify.filter";

import echo from "../helpers/echo.handler";
import {getServer} from "../helpers/server.helper";
import {async} from "../helpers/test.helper";
import {signWithJws as sign} from "../helpers/jws.helper";

describe("JoseVerifyFilter", () => {
  let sandbox;
  let service;
  let header;
  let payload;
  let keystore;
  let promisedKey;
  let server;
  let handler;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    service = new JoseService();

    header = {nonce: "lala", url: "http://lala.land/lala"};
    payload = {lala: "LALA"};

    keystore = JWK.createKeyStore();
    promisedKey = keystore.generate("EC", "P-256");

    handler = sandbox.spy(echo);

    server = getServer({
      parser: "json",
      setup: (server) => {
        server.use(joseVerify({joseService: service}));
        server.all("/*", handler);
      }
    });
  });

  afterEach((done) => {
    sandbox.restore();
    server.close(done);
  });

  it("should should extract JWS payload", async(() => (
    server.getReady()
      .then(() => promisedKey)
      .then(sign(header, payload, {hasJwk: true, hasKid: false}))
      .then((jws) => (
        request({
          uri: `http://localhost:${server.getPort()}/lala`,
          method: "POST",
          json: true,
          body: jws
        }).then(() => {
          expect(handler).to.have.been.calledOnce
            .and.to.have.been.calledWith(sinon.match.has("body", {lala: "LALA"}))
            .and.to.have.been.calledWith(sinon.matchHasDeep("__leServoFilters.jose.verifiedKey"))
            .and.to.have.been.calledWith(sinon.matchHasDeep(
              "__leServoFilters.jose.verifiedNonce",
              "lala"
            ));
        })
      ))
  )));

  it("should should preserve none JWS request body", async(() => (
    server.getReady()
      .then(() => promisedKey)
      .then(sign(header, payload, {hasJwk: true, hasKid: false}))
      .then(() => (
        request({
          uri: `http://localhost:${server.getPort()}/lala`,
          method: "POST",
          json: true,
          body: {something: "else"}
        }).then(() => {
          expect(handler).to.have.been.calledOnce
            .and.to.have.been.calledWith(sinon.match.has("body", {something: "else"}))
            .and.to.have.not.been.calledWith(sinon.matchHasDeep("__leServoFilters.jose.verifiedKey"))
            .and.to.have.not.been.calledWith(sinon.matchHasDeep(
              "__leServoFilters.jose.verifiedNonce"
            ));
        })
      ))
  )));
});
