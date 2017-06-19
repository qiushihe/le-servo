import {getJson} from "src/helpers/json.helper";

describe("JsonHelper", () => {
  describe("#getJson()", () => {
    it("should return JSON object from JSON string", () => {
      expect(getJson("{\"name\":\"Lala\"}")).to.have.property("name", "Lala");
    });

    it("should return JSON object from JSON object", () => {
      expect(getJson({name: "Lala"})).to.have.property("name", "Lala");
    });
  });
});
