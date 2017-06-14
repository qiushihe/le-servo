import chai, {expect} from "chai";
import sinon, {match} from "sinon";
import sinonChai from "sinon-chai";
import {JWK} from "node-jose";
import express from "express";
import bodyParser from "body-parser";
import Promise from "bluebird";
import request from "request-promise";

import JoseService from "services/jose.service";
import joseVerify from "filters/jose-verify.filter";

import echo from "../helpers/echo.handler";
import {getRansomPort} from "../helpers/server.helper";
import {async} from "../helpers/test.helper";
import {signWithJws as sign} from "../helpers/jws.helper";
import {matchHasDeep} from "../helpers/match.helper";

chai.use(sinonChai);

describe("JoseVerifyFilter", () => {
  let sandbox;
  let service;
  let header;
  let payload;
  let keystore;
  let promisedKey;
  let port;
  let server;
  let handler;
  let serverReady;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    service = new JoseService();

    header = {nonce: "lala", url: "http://lala.land/lala"};
    payload = {lala: "LALA"};

    keystore = JWK.createKeyStore();
    promisedKey = keystore.generate("EC", "P-256");

    port = getRansomPort();
    server = express();
    handler = sandbox.spy(echo);

    server.use(bodyParser.json());
    server.use(joseVerify({joseService: service}));
    server.all("/*", handler);

    serverReady = new Promise((resolve) => {
      server.listen(port, resolve);
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should should extract JWS payload", async(() => (
    serverReady
      .then(() => promisedKey)
      .then(sign(header, payload, {hasJwk: true, hasKid: false}))
      .then((jws) => (
        request({
          uri: `http://localhost:${port}/lala`,
          method: "POST",
          json: true,
          body: jws
        }).then(() => {
          expect(handler).to.have.been.calledOnce
            .and.to.have.been.calledWith(match.has("body", {lala: "LALA"}))
            .and.to.have.been.calledWith(matchHasDeep("__leServoFilters.jose.verifiedKey"))
            .and.to.have.been.calledWith(matchHasDeep(
              "__leServoFilters.jose.verifiedNonce",
              "lala"
            ));
        })
      ))
  )));

  it("should should preserve none JWS request body", async(() => (
    serverReady
      .then(() => promisedKey)
      .then(sign(header, payload, {hasJwk: true, hasKid: false}))
      .then((jws) => (
        request({
          uri: `http://localhost:${port}/lala`,
          method: "POST",
          json: true,
          body: {something: "else"}
        }).then(() => {
          expect(handler).to.have.been.calledOnce
            .and.to.have.been.calledWith(match.has("body", {something: "else"}))
            .and.to.have.not.been.calledWith(matchHasDeep("__leServoFilters.jose.verifiedKey"))
            .and.to.have.not.been.calledWith(matchHasDeep(
              "__leServoFilters.jose.verifiedNonce"
            ));
        })
      ))
  )));
});
