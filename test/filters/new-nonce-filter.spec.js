import {expect} from "chai";
import express from "express";
import Promise from "bluebird";
import request from "request-promise";
import flow from "lodash/fp/flow";

import newNonce from "filters/new-nonce.filter";

import {async, getRansomPort} from "../test-helpers";

describe("NonceFilter", () => {
  let port;
  let serverReady;

  beforeEach(() => {
    port = getRansomPort();
    serverReady = new Promise((resolve) => {
      flow([
        newNonce,
        (server) => {
          server.get("/*", (_, res) => res.end());
          server.listen(port, resolve);
        }
      ])(express());
    });
  });

  it("should add replay-nonce header to responses", async(() => (
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
});
