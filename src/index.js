import express from "express";
import bodyParser from "body-parser";

import newNonce from "filters/new-nonce.filter";
import jose from "filters/jose.filter";
import useNonce from "filters/use-nonce.filter";

import empty from "handlers/empty.handler";

const port = 3000;
const server = express();

server.use(bodyParser.json());
server.use(newNonce);
server.use(jose);
server.use(useNonce);

server.all("/new-nonce", empty);

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
