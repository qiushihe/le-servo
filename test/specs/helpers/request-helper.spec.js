import {getJoseVerifiedKey} from "src/helpers/request.helper";

describe("NumberHelper", () => {
  describe("#getJoseVerifiedKey()", () => {
    it("should return nested verified jose key", () => {
      expect(getJoseVerifiedKey({__leServoFilters: {jose: {verifiedKey: 42}}})).to.equal(42);
    });
  });
});
