import {JWK} from "node-jose";

import JoseService from "src/services/jose.service";

import {async} from "test/helpers/test.helper";
import {signWithJws as sign} from "test/helpers/jws.helper";

describe("JoseService", () => {
  let sandbox;
  let service;
  let keystore;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    service = new JoseService();
    keystore = JWK.createKeyStore();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#verify()", () => {
    let header;
    let payload;
    let promisedKey;

    beforeEach(() => {
      header = {nonce: "lala", url: "http://lala.land/lala"};
      payload = {lala: "LALA"};
      promisedKey = keystore.generate("EC", "P-256");
    });

    it("should verify header and payload for new key", async(() => (
      promisedKey
        .then(sign(header, payload, {hasJwk: true, hasKid: false}))
        .then((jws) => service.verify(jws))
        .then(({payload: verifiedPayload, header: verifiedHeader}) => {
          const {nonce: verifiedNonce, url: verifiedUrl} = verifiedHeader;
          expect(verifiedNonce).to.equal(header.nonce);
          expect(verifiedUrl).to.equal(header.url);
          expect(verifiedPayload).to.deep.equal(payload);
        })
    )));

    it("should verify header and payload for existing key", async(() => (
      promisedKey
        .then((key) => service.addKey(key))
        .then(sign(header, payload, {hasJwk: false, hasKid: true}))
        .then((jws) => service.verify(jws))
        .then(({payload: verifiedPayload, header: verifiedHeader}) => {
          const {nonce: verifiedNonce, url: verifiedUrl} = verifiedHeader;
          expect(verifiedNonce).to.equal(header.nonce);
          expect(verifiedUrl).to.equal(header.url);
          expect(verifiedPayload).to.deep.equal(payload);
        })
    )));

    it("should not accept header with invalid kid", async(() => (
      promisedKey
        .then(sign(header, payload, {hasJwk: false, hasKid: true}))
        .then((jws) => service.verify(jws))
        .then(() => {
          const err = new Error("Invalid header accepted");
          err._rethrow = true;
          throw err;
        })
        .catch((err) => {
          if (err._rethrow) {
            throw err;
          }
          expect(err.message).to.equal("Invalid header: Key not found for provided kid");
        })
    )));

    it("should not accept header with both jwk and kid", async(() => (
      promisedKey
        .then(sign(header, payload, {hasJwk: true, hasKid: true}))
        .then((jws) => service.verify(jws))
        .then(() => {
          const err = new Error("Invalid header accepted");
          err._rethrow = true;
          throw err;
        })
        .catch((err) => {
          if (err._rethrow) {
            throw err;
          }
          expect(err.message).to.equal("Invalid header: Can not have both kid and jwk");
        })
    )));

    it("should not accept header with neither jwk nor kid", async(() => (
      promisedKey
        .then(sign(header, payload, {hasJwk: false, hasKid: false}))
        .then((jws) => service.verify(jws))
        .then(() => {
          const err = new Error("Invalid header accepted");
          err._rethrow = true;
          throw err;
        })
        .catch((err) => {
          if (err._rethrow) {
            throw err;
          }
          expect(err.message).to.equal("Invalid header: Missing either kid or jwk");
        })
    )));

    it("should not accept header with missing fields", async(() => (
      promisedKey
        .then(sign({}, payload, {hasJwk: true, hasKid: false}))
        .then((jws) => service.verify(jws))
        .then(() => {
          const err = new Error("Invalid header accepted");
          err._rethrow = true;
          throw err;
        })
        .catch((err) => {
          if (err._rethrow) {
            throw err;
          }
          expect(err.message).to.equal("Invalid header: Must have alg, nonce and url");
        })
    )));
  });

  describe("#addKey()", () => {
    let promisedKey;

    beforeEach(() => {
      promisedKey = keystore.generate("EC", "P-256");
    });

    it("should add new key", async(() => (
      promisedKey
        .then((key) => {
          expect(service.keystore.all()).to.have.lengthOf(0);
          return key;
        })
        .then((key) => service.addKey(key))
        .then(() => {
          expect(service.keystore.all()).to.have.lengthOf(1);
        })
    )));

    it("should not add existing key", async(() => (
      promisedKey
        .then((key) => service.addKey(key))
        .then((key) => {
          expect(service.keystore.all()).to.have.lengthOf(1);
          return key;
        })
        .then((key) => service.addKey(key))
        .then(() => {
          expect(service.keystore.all()).to.have.lengthOf(1);
        })
    )));
  });
});
