import Promise from "bluebird";
import uuidV4 from "uuid/v4";

import NonceService from "src/services/nonce.service";
import {isValid} from "src/helpers/nonce.helper";

import {async} from "test/helpers/test.helper";

describe("NonceService", () => {
  let service;

  beforeEach(() => {
    service = new NonceService();
  });

  describe("#getNonce()", () => {
    it("should return a promise", () => {
      expect(service.getNonce()).to.be.an.instanceof(Promise);
    });

    it("should not resolve to null value", async(() => {
      return service.getNonce().then((nonce) => {
        expect(nonce).to.not.be.null;
      });
    }));

    it("should not resolve to empty value", async(() => {
      return service.getNonce().then((nonce) => {
        expect(nonce.length).to.be.above(0);
      });
    }));

    it("should resolve to valid nonce", async(() => {
      return service.getNonce().then((nonce) => {
        expect(isValid(nonce)).to.be.true;
      });
    }));
  });

  describe("#useNonce()", () => {
    let nonce;

    beforeEach(() => {
      nonce = uuidV4();
    });

    it("should return a promise", () => {
      expect(service.useNonce(nonce)).to.be.an.instanceof(Promise);
    });

    it("should accept valid nonce", async(() => {
      return service.useNonce(nonce).catch(() => {
        throw new Error("Valid nonce should not be rejected");
      });
    }));

    it("should not accept used nonce", async(() => {
      return service.useNonce(nonce).then(
        () => service.useNonce(nonce)
      ).then(() => {
        throw new Error("Used nonce should not be accepted");
      });
    }));
  });
});
