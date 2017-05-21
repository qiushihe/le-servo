import {expect} from "chai";
import express from "express";
import Promise from "bluebird";
import request from "request-promise";

import newNonce from "filters/new-nonce.filter";

import echo from "../helpers/echo.handler";
import {getRansomPort} from "../helpers/server.helper";
import {async} from "../helpers/test.helper";

describe("NonceFilter", () => {
  let port;
  let server;
  let serverReady;

  beforeEach(() => {
    port = getRansomPort();
    server = express();

    server.use(newNonce);
    server.all("/*", echo);

    serverReady = new Promise((resolve) => {
      server.listen(port, resolve);
    });
  });

  it("should add replay-nonce header to GET responses", async(() => (
    serverReady.then(() => (
      request({
        uri: `http://localhost:${port}/lala`,
        method: "GET",
        resolveWithFullResponse: true
      }).then(function (res) {
        expect(res.headers).to.have.property("replay-nonce");
      })
    ))
  )));

  it("should add replay-nonce header to POST responses", async(() => (
    serverReady.then(() => (
      request({
        uri: `http://localhost:${port}/lala`,
        method: "POST",
        resolveWithFullResponse: true,
        body: "LALA"
      }).then(function (res) {
        expect(res.headers).to.have.property("replay-nonce");
      })
    ))
  )));

  it("should add replay-nonce header to PUT responses", async(() => (
    serverReady.then(() => (
      request({
        uri: `http://localhost:${port}/lala`,
        method: "PUT",
        resolveWithFullResponse: true,
        body: "LALA"
      }).then(function (res) {
        expect(res.headers).to.have.property("replay-nonce");
      })
    ))
  )));
});
