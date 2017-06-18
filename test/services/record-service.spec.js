import RecordService from "src/services/record.service";

import {async} from "test/helpers/test.helper";

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

  describe("#find()", () => {
    beforeEach(() => {
      service.records["lala1"] = {id: "lala1", title: "LALA1", score: 42};
      service.records["lala2"] = {id: "lala2", title: "LALA2", score: 43};
    });

    it("should find record with maching query", async(() => (
      service.find({title: "LALA1"}).then((record) => {
        expect(record).to.have.property("title", "LALA1");
        expect(record).to.have.property("score", 42);
      })
    )));

    it("should not find anything with mis-matching query", async(() => (
      service.find({title: "LALA42"}).then((record) => {
        expect(record).to.be.null;
      })
    )));
  });

  describe("#get()", () => {
    beforeEach(() => {
      service.records["lala"] = {id: "lala", title: "LALA", score: 42};
    });

    it("should return record by id", async(() => (
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

    it("should not accept invalid id", () => (
      service.get("lala42").then(() => {
        const err = new Error("Invalid id accepted");
        err._rethrow = true;
        throw err;
      }).catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err.message).to.equal("Record not found with id: lala42");
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

    it("should not accept existing id", () => {
      service.records["lala42"] = {id: "lala42", title: "Lala42 title", score: 42};
      return service.create("lala42").then(() => {
        const err = new Error("Existing id accepted");
        err._rethrow = true;
        throw err;
      }).catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err.message).to.equal("Record already exist with id: lala42");
      });
    });
  });

  describe("#update()", () => {
    beforeEach(() => {
      service.records["lala"] = {id: "lala", title: "Lala title", score: 42};
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

    it("should not accept invalid id", () => (
      service.update("lala42", {title: "New title"}).then(() => {
        const err = new Error("Invalid id accepted");
        err._rethrow = true;
        throw err;
      }).catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err.message).to.equal("Record not found with id: lala42");
      })
    ));
  });

  describe("#remove()", () => {
    beforeEach(() => {
      service.records["lala1"] = {id: "lala1", title: "Lala1 title", score: 42};
      service.records["lala2"] = {id: "lala2", title: "Lala2 title", score: 43};
    });

    it("should remove a record", async(() => (
      service.remove("lala1").then(() => {
        expect(service.records).to.not.have.property("lala1");
      })
    )));

    it("should not accept invalid id", () => (
      service.remove("lala42").then(() => {
        const err = new Error("Invalid id accepted");
        err._rethrow = true;
        throw err;
      }).catch((err) => {
        if (err._rethrow) {
          throw err;
        }
        expect(err.message).to.equal("Record not found with id: lala42");
      })
    ));
  });
});
