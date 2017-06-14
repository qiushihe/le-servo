import chai, {expect} from "chai";
import sinon, {match} from "sinon";
import sinonChai from "sinon-chai";

import DirectoryService from "services/directory.service";

chai.use(sinonChai);

describe("DirectoryService", () => {
  let sandbox;
  let service;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    service = new DirectoryService({origin: "http://lala.com/acme"});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#getFullUrl()", () => {
    it("should return full URL with origin", () => {
      expect(service.getFullUrl("/lala/42")).to.equal("http://lala.com/acme/lala/42");
    });
  });

  describe("#addField()", () => {
    it("should store the field data", () => {
      const handler = () => {};
      service.addField("lala", {method: "PUT", path: "/la-la", handler});
      expect(service.fields).to.have.property("lala");
      expect(service.fields.lala).to.have.property("method", "PUT");
      expect(service.fields.lala).to.have.property("path", "/la-la");
      expect(service.fields.lala).to.have.property("handler", handler);
    });
  });

  describe("#each()", () => {
    it("should iterate over stored fields data", () => {
      const iterator = sandbox.stub();

      service.addField("lala1", {method: "PUT", path: "/la-la1", handler: () => {}});
      service.addField("lala2", {method: "GET", path: "/la-la2", handler: () => {}});
      service.each(iterator);

      expect(iterator).to.have.been.calledTwice;
      expect(iterator.getCall(0)).to.have.been.calledWith("lala1", match({
        method: "PUT", path: "/la-la1", handler: match.func
      }));
      expect(iterator.getCall(1)).to.have.been.calledWith("lala2", match({
        method: "GET", path: "/la-la2", handler: match.func
      }));
    });
  });

  describe("#toJSON()", () => {
    it("should generate JSON object for field registry", () => {
      service.addField("lala1", {method: "PUT", path: "/la-la1", handler: () => {}});
      service.addField("lala2", {method: "GET", path: "/la-la2", handler: () => {}});

      expect(JSON.stringify(service.toJSON())).to.equal(
        "{\"lala1\":\"http://lala.com/acme/la-la1\",\"lala2\":\"http://lala.com/acme/la-la2\"}"
      );
    });
  });
});
