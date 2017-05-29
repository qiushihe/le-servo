import express from "express";
import bodyParser from "body-parser";

import {
  Config as DefaultServicesConfig,
  GetDirectoryService
} from "services/default.services";

import newNonce from "filters/new-nonce.filter";
import joseVerify from "filters/jose-verify.filter";
import useNonce from "filters/use-nonce.filter";

import empty from "handlers/empty.handler";
import directory from "handlers/directory.handler";

DefaultServicesConfig.DirectoryService = [{origin: "http://localhost:3000"}];

const directoryService = GetDirectoryService();
directoryService.addField("new-nonce", {method: "all", path: "/new-nonce", handler: empty});

const port = 3000;
const server = express();

server.use(bodyParser.json());
server.use(newNonce);
server.use(joseVerify);
server.use(useNonce);

server.get("/directory", directory);

directoryService.each((_, {method, path, handler}) => {
  server[method](path, handler);
});

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
