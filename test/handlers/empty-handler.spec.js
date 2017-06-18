import request from "request-promise";

import empty from "handlers/empty.handler";

import {getServer} from "../helpers/server.helper";
import {async} from "../helpers/test.helper";

describe("EmptyHandler", () => {
  let server;

  beforeEach(() => {
    server = getServer({
      parser: "json",
      setup: (server) => {
        server.all("/lala", empty);
      }
    });
  });

  afterEach((done) => {
    server.close(done);
  });

  it("should respond with 204 no content", async(() => (
    server.getReady().then(() => (
      request({
        uri: `http://localhost:${server.getPort()}/lala`,
        method: "GET",
        resolveWithFullResponse: true
      }).then((res) => {
        expect(res.body).to.be.empty;
        expect(res.statusCode).to.equal(204);
      })
    ))
  )));
});
