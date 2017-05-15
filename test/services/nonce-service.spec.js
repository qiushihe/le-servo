import {expect} from "chai";
import Promise from "bluebird";
import uuidV4 from "uuid/v4";

import NonceService from "services/nonce.service";
import {isValid} from "helpers/nonce.helper";

import {promiseIt} from "../test-helpers";

describe("NonceService", () => {
  let service;

  beforeEach(() => {
    service = new NonceService();
  });

  describe("#getNonce()", () => {
    it("should return a promise", () => {
      expect(service.getNonce()).to.be.an.instanceof(Promise);
    });

    promiseIt("should not resolve to null value", () => (
      service.getNonce().then((nonce) => {
        expect(nonce).to.not.be.null;
      })
    ));

    promiseIt("should not resolve to empty value", () => (
      service.getNonce().then((nonce) => {
        expect(nonce.length).to.be.above(0);
      })
    ));

    promiseIt("should resolve to valid nonce", () => (
      service.getNonce().then((nonce) => {
        expect(isValid(nonce)).to.be.true;
      })
    ));
  });

  describe("#useNonce()", () => {
    let nonce;

    beforeEach(() => {
      nonce = uuidV4();
    });

    it("should return a promise", () => {
      expect(service.useNonce(nonce)).to.be.an.instanceof(Promise);
    });

    promiseIt("should accept valid nonce", () => (
      service.useNonce(nonce).catch(() => {
        throw new Error("Valid nonce should not be rejected");
      })
    ));

    promiseIt("should not accept used nonce", () => (
      service.useNonce(nonce).then(
        () => service.useNonce(nonce)
      ).then(() => {
        throw new Error("Used nonce should not be accepted");
      })
    ));
  });
});
