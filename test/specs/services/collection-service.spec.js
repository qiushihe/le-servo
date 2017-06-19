import CollectionService from "src/services/collection.service";

import {async} from "test/helpers/test.helper";

describe("CollectionService", () => {
  let service;

  beforeEach(() => {
    service = new CollectionService({
      records: [{
        name: "record1",
        attributes: [{name: "title", defaultValue: "R1 title"}]
      }, {
        name: "record2",
        attributes: [{name: "title", defaultValue: "R2 title"}]
      }]
    });
  });

  it("should provide access to defined collections", async(() => (
    service.get("record1")
      .then((record1s) => {
        expect(record1s).to.be.ok;
      })
      .then(() => service.get("record2"))
      .then((record2s) => {
        expect(record2s).to.be.ok;
      })
  )));
});
