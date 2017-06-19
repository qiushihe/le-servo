import {
  isFiniteNumber,
  isPositiveNumber
} from "src/helpers/number.helper";

describe("NumberHelper", () => {
  describe("#isFiniteNumber()", () => {
    it("should accept finite number", () => {
      expect(isFiniteNumber(42)).to.be.ok;
    });

    it("should reject infinite number", () => {
      expect(isFiniteNumber(Infinity)).to.not.be.ok;
    });
  });

  describe("#isPositiveNumber()", () => {
    it("should accept positive number", () => {
      expect(isPositiveNumber(42)).to.be.ok;
    });

    it("should reject negative number", () => {
      expect(isPositiveNumber(-42)).to.not.be.ok;
    });
  });
});
