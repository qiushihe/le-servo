import {isValid} from "src/helpers/nonce.helper";

describe("NonceHelper", () => {
  describe("#isValid()", () => {
    it("should accept valid nonce", () => {
      expect(isValid("42")).to.be.ok;
    });

    it("should reject invalid nonce", () => {
      expect(isValid("*/")).to.not.be.ok;
    });
  });
});
