import {JWK} from "node-jose";
import Promise from "bluebird";
import request from "request-promise";

import getServer from "src/server";

import {getRansomPort} from "test/helpers/server.helper";
import {async} from "test/helpers/test.helper";
import {signWithJws as sign} from "test/helpers/jws.helper";

describe.only("Test", () => {
  let port;
  let server;
  let listener;
  let ready;

  let getUrl;

  let clientKeystore;
  let clientKeyReady;

  beforeEach(() => {
    port = getRansomPort();

    server = getServer({
      origin: `http://localhost:${port}`,
      nonceBufferSize: 32
    });

    ready = new Promise((resolve) => {
      listener = server.listen(port, resolve);
    });

    getUrl = (path) => `http://localhost:${port}${path}`;

    clientKeystore = JWK.createKeyStore();
    clientKeyReady = clientKeystore.generate("EC", "P-256");
  });

  afterEach((done) => {
    listener.close(done);
  });

  it("should lala", async(() => (
    ready.then(() => {
      return request({
        uri: getUrl("/directory"),
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
        return {directory, nonce: res.headers["replay-nonce"], key, account: res.body};
      });
    }).then(({directory, nonce, key, account}) => {
      console.log("directory", directory);
      console.log("nonce", nonce);
      console.log("key", key);
      console.log("account", account);
    })
  )));
});
