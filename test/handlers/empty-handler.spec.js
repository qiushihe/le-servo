import request from "request-promise";

import empty from "handlers/empty.handler";

import {getServer, getRansomPort} from "../helpers/server.helper";
import {async} from "../helpers/test.helper";

describe("EmptyHandler", () => {
  let port;
  let serverReady;

  beforeEach(() => {
    const server = getServer({
      port: getRansomPort(),
      bodyParser: "json",
      setup: (server) => {
        server.all("/lala", empty);
      }
    });
    port = server.port;
    serverReady = server.ready;
  });

  it("should respond with 204 no content", async(() => (
    serverReady.then(() => (
      request({
        uri: `http://localhost:${port}/lala`,
        method: "GET",
        resolveWithFullResponse: true
      }).then((res) => {
        expect(res.body).to.be.empty;
        expect(res.statusCode).to.equal(204);
      })
    ))
  )));
});
