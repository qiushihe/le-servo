/* eslint-disable no-unused-vars */
import {JWK} from "node-jose";
import request from "request-promise";
import base64url from "base64url";

import serverBuilder from "src/server-builder";

import {getServer, getRansomPort} from "test/helpers/server.helper";
import {async} from "test/helpers/test.helper";
import {signWithJws as sign} from "test/helpers/jws.helper";

import csrFixture from "test/fixtures/csr-base64url/lala.com.js";

describe("Integration Test", () => {
  let port;
  let server;

  let clientKeystore;
  let clientKeyReady;

  beforeEach(() => {
    port = getRansomPort();

    server = getServer({
      port,
      setup: serverBuilder({
        origin: `http://localhost:${port}`,
        nonceBufferSize: 32,
        suppressLogging: true
      })
    });

    clientKeystore = JWK.createKeyStore();
    clientKeyReady = clientKeystore.generate("EC", "P-256");
  });

  afterEach((done) => {
    server.close(done);
  });

  it("should complete the basic flow", async(() => (
    server.getReady().then(() => {
      return request({
        uri: `http://localhost:${port}/directory`,
        method: "GET",
        json: true
      }).then((directory) => {
        expect(directory).to.have.property("new-nonce");
        expect(directory).to.have.property("new-account");
        expect(directory).to.have.property("new-order");
        return {directory};
      });
    }).then(({directory}) => {
      return request({
        uri: directory["new-nonce"],
        method: "HEAD",
        resolveWithFullResponse: true
      }).then((res) => {
        expect(res.headers).to.have.property("replay-nonce");
        return {directory, nonce: res.headers["replay-nonce"]};
      });
    }).then(({directory, nonce}) => {
      return clientKeyReady.then((key) => {
        return {directory, nonce, key};
      });
    }).then(({directory, nonce, key}) => {
      const header = {nonce, url: directory["new-account"]};
      const payload = {
        "terms-of-service-agreed": true,
        "contact": ["integration@le-servo.test.com"]
      };

      return sign(header, payload, {hasJwk: true, hasKid: false})(key).then((jws) => {
        return request({
          uri: directory["new-account"],
          method: "POST",
          json: true,
          body: jws,
          resolveWithFullResponse: true
        });
      }).then((res) => {
        expect(res.body).to.have.property("status", "valid");
        expect(res.body).to.have.property("orders");
        expect(res.body.contact).to.not.be.empty;
        expect(res.body.contact[0]).to.equal("integration@le-servo.test.com");
        return {directory, nonce: res.headers["replay-nonce"], key, account: res.body};
      });
    }).then(({directory, nonce, key, account}) => {
      const header = {nonce, url: directory["new-order"]};
      const payload = {"csr": csrFixture};

      return sign(header, payload, {hasJwk: false, hasKid: true})(key).then((jws) => {
        return request({
          uri: directory["new-order"],
          method: "POST",
          json: true,
          body: jws,
          resolveWithFullResponse: true
        });
      }).then((res) => {
        expect(res.body).to.have.property("status", "pending");
        expect(res.body).to.have.property("csr");
        expect(res.body.authorizations).to.not.be.empty;
        return {directory, nonce: res.headers["replay-nonce"], key, account, order: res.body};
      });
    }).then(({directory, nonce, key, account, order}) => {
      return request({
        uri: order.authorizations[0],
        method: "GET",
        json: true
      }).then((authorization) => {
        expect(authorization).to.have.property("status", "pending");
        expect(authorization).to.have.property("identifier");
        expect(authorization.identifier).to.have.property("type", "dns");
        expect(authorization.identifier).to.have.property("value", "lala.com");
        expect(authorization).to.have.property("challenges");
        expect(authorization.challenges).to.not.be.empty;
        expect(authorization.challenges[0]).to.have.property("type", "tls-sni-01");
        expect(authorization.challenges[0]).to.have.property("status", "pending");
        return {directory, nonce, key, account, order, authorization};
      });
    }).then(({directory, nonce, key, account, order, authorization}) => {
      const challenge = authorization.challenges[0];
      const header = {nonce, url: challenge.url};

      return key.thumbprint("SHA-256").then((thumbprint) => {
        const payload = {
          "type": "tls-sni-01",
          "keyAuthorization": `${challenge.token}.${base64url(thumbprint)}`
        };

        return sign(header, payload, {hasJwk: false, hasKid: true})(key).then((jws) => {
          return request({
            uri: challenge.url,
            method: "POST",
            json: true,
            body: jws,
            resolveWithFullResponse: true
          });
        }).then((res) => {
          expect(res.body).to.have.property("status", "pending");
        });
      });
    })
  )));
});
/* eslint-enable no-unused-vars */
