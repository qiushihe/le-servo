import chai, {expect} from "chai";
import chaiChange from "chai-change";

import RecordService from "services/record.service";

import {async} from "../helpers/test.helper";

chai.use(chaiChange);

describe("RecordService", () => {
  let service;

  beforeEach(() => {
    service = new RecordService({
      attributes: [
        {name: "title", defaultValue: "Record title"},
        {name: "score", defaultValue: 0}
      ]
    });
  });

  describe("#get()", () => {
    beforeEach(() => {
      service.records["lala"] = {title: "LALA", score: 42};
    });

    it("should return record by key", async(() => (
      service.get("lala").then((record) => {
        expect(record).to.have.property("title", "LALA");
        expect(record).to.have.property("score", 42);
      })
    )));

    it("should return a copy of the record", async(() => (
      service.get("lala").then((record) => {
        expect(() => {
          record.title = "LALA42";
        }).to.not.alter(() => service.records["lala"].title);
      })
    )));

    it("should not accept invalid key", () => (
      service.get("lala42").then(() => {
        const err = new Error("Invalid key accepted");
        err._rethrow = true;
        throw err;
      }).catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err.message).to.equal("Record not found with key: lala42");
      })
    ));
  });

  describe("#create()", () => {
    it("should return a new record with default values", async(() => (
      service.create("lala").then((record) => {
        expect(record).to.have.property("title", "Record title");
        expect(record).to.have.property("score", 0);
      })
    )));

    it("should return a copy of the record", async(() => (
      service.create("lala").then((record) => {
        expect(() => {
          record.title = "LALA42";
        }).to.not.alter(() => service.records["lala"].title);
      })
    )));

    it("should not accept existing key", () => {
      service.records["lala42"] = {title: "Lala42 title", score: 42};
      return service.create("lala42").then(() => {
        const err = new Error("Existing key accepted");
        err._rethrow = true;
        throw err;
      }).catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err.message).to.equal("Record already exist with key: lala42");
      });
    });
  });

  describe("#update()", () => {
    beforeEach(() => {
      service.records["lala"] = {title: "Lala title", score: 42};
    });

    it("should update a record with new values", async(() => (
      service.update("lala", {title: "New title"}).then((record) => {
        expect(record).to.have.property("title", "New title");
        expect(record).to.have.property("score", 42);
      })
    )));

    it("should return a copy of the record", async(() => (
      service.update("lala", {title: "New title"}).then((record) => {
        expect(() => {
          record.title = "LALA42";
        }).to.not.alter(() => service.records["lala"].title);
      })
    )));

    it("should not accept invalid key", () => (
      service.update("lala42", {title: "New title"}).then(() => {
        const err = new Error("Invalid key accepted");
        err._rethrow = true;
        throw err;
      }).catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err.message).to.equal("Record not found with key: lala42");
      })
    ));
  });

  describe("#remove()", () => {
    beforeEach(() => {
      service.records["lala1"] = {title: "Lala1 title", score: 42};
      service.records["lala2"] = {title: "Lala2 title", score: 43};
    });

    it("should remove a record", async(() => (
      service.remove("lala1").then(() => {
        expect(service.records).to.not.have.property("lala1");
      })
    )));

    it("should not accept invalid key", () => (
      service.remove("lala42").then(() => {
        const err = new Error("Invalid key accepted");
        err._rethrow = true;
        throw err;
      }).catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err.message).to.equal("Record not found with key: lala42");
      })
    ));
  });
});
