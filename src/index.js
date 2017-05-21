import express from "express";
import bodyParser from "body-parser";

import newNonce from "filters/new-nonce.filter";
import jose from "filters/jose.filter";
import hallo from "handlers/hallo.handler";

const port = 3000;
const server = express();

server.use(bodyParser.json());
server.use(newNonce);
server.use(jose);

server.all("/*", hallo);

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
