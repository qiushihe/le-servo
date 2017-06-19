import {parseCsr} from "src/helpers/csr.helper";

import lalaDotCom from "test/fixtures/csr-base64url/lala.com";
import notExampleDotCom from "test/fixtures/csr-base64url/not-example.com";

import {async} from "test/helpers/test.helper";

describe("CsrHelper", () => {
  describe("#parseCsr()", () => {
    it("should parse names for CSR", async(() => (
      parseCsr(lalaDotCom).then((result) => {
        expect(result).to.deep.equal(["lala.com"]);
      })
    )));

    it("should parse extension names for CSR", async(() => (
      parseCsr(notExampleDotCom).then((result) => {
        expect(result).to.deep.equal(["not-example.com", "www.not-example.com"]);
      })
    )));
  });
});
