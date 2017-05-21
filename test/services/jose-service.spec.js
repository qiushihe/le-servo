import {expect} from "chai";
import {JWK, JWS} from "node-jose";
import get from "lodash/fp/get";
import Promise from "bluebird";

import JoseService from "services/jose.service";

import {async} from "../helpers/test.helper";
import {signWithJws as sign} from "../helpers/jws.helper";

describe("JoseService", () => {
  let service;
  let keystore;

  beforeEach(() => {
    service = new JoseService();
    keystore = JWK.createKeyStore();
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

    it("should verify header and payload for new key", async(() => {
      return promisedKey
        .then(sign(header, payload, {hasJwk: true, hasKid: false}))
        .then((jws) => service.verify(jws))
        .then(({payload: verifiedPayload, header: verifiedHeader}) => {
          const {nonce: verifiedNonce, url: verifiedUrl} = verifiedHeader;
          expect(verifiedNonce).to.equal(header.nonce);
          expect(verifiedUrl).to.equal(header.url);
          expect(verifiedPayload).to.deep.equal(payload);
        });
    }));

    it("should verify header and payload for existing key", async(() => {
      return promisedKey
        .then((key) => {
          service.keystore.add(key);
          return key;
        })
        .then(sign(header, payload, {hasJwk: false, hasKid: true}))
        .then((jws) => service.verify(jws))
        .then(({payload: verifiedPayload, header: verifiedHeader}) => {
          const {nonce: verifiedNonce, url: verifiedUrl} = verifiedHeader;
          expect(verifiedNonce).to.equal(header.nonce);
          expect(verifiedUrl).to.equal(header.url);
          expect(verifiedPayload).to.deep.equal(payload);
        });
    }));

    it("should not accept header with invalid kid", async(() => {
      return promisedKey
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
        });
    }));

    it("should not accept header with both jwk and kid", async(() => {
      return promisedKey
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
        });
    }));

    it("should not accept header with neither jwk nor kid", async(() => {
      return promisedKey
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
        });
    }));

    it("should not accept header with missing fields", async(() => {
      return promisedKey
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
        });
    }));
  });
});
