import {expect} from "chai";
import {JWK} from "node-jose";
import express from "express";
import bodyParser from "body-parser";
import Promise from "bluebird";
import request from "request-promise";

import jose from "filters/jose.filter";

import echo from "../helpers/echo.handler";
import {getRansomPort} from "../helpers/server.helper";
import {async} from "../helpers/test.helper";
import {signWithJws as sign} from "../helpers/jws.helper";

describe("JoseFilter", () => {
  let header;
  let payload;
  let keystore;
  let promisedKey;
  let port;
  let server;
  let serverReady;

  beforeEach(() => {
    header = {nonce: "lala", url: "http://lala.land/lala"};
    payload = {lala: "LALA"};

    keystore = JWK.createKeyStore();
    promisedKey = keystore.generate("EC", "P-256");

    port = getRansomPort();
    server = express();

    server.use(bodyParser.json());
    server.use(jose);
    server.all("/*", echo);

    serverReady = new Promise((resolve) => {
      server.listen(port, resolve);
    });
  });

  it("should should extract JWS payload", async(() => (
    serverReady
      .then(() => promisedKey)
      .then(sign(header, payload, {hasJwk: true, hasKid: false}))
      .then((jws) => (
        request({
          uri: `http://localhost:${port}/lala`,
          method: "POST",
          resolveWithFullResponse: true,
          json: true,
          body: jws
        }).then(function (res) {
          expect(res.body).to.have.property("lala", "LALA");
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
          resolveWithFullResponse: true,
          json: true,
          body: {something: "else"}
        }).then(function (res) {
          expect(res.body).to.have.property("something", "else");
        })
      ))
  )));
});
