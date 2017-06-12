import express from "express";
import bodyParser from "body-parser";

import NonceService from "services/nonce.service";
import JoseService from "services/jose.service";
import DirectoryService from "services/directory.service";
import CollectionService from "services/collection.service";

import newNonce from "filters/new-nonce.filter";
import joseVerify from "filters/jose-verify.filter";
import useNonce from "filters/use-nonce.filter";

import empty from "handlers/empty.handler";
import directory from "handlers/directory.handler";
import newAccount from "handlers/account/new-account.handler";

const nonceService = new NonceService({bufferSize: 32});
const joseService = new JoseService();
const directoryService = new DirectoryService({origin: "http://localhost:3000"});
const collectionService = new CollectionService({
  records: [{
    name: "accounts",
    attributes: [
      {name: "status", defaultValue: "valid"},
      {name: "contact", defaultValue: []},
      {name: "termsOfServiceAgreed", defaultValue: false},
      {name: "kid", defaultValue: null}
    ]
  }]
});

directoryService.addField("new-nonce", {
  method: "all", path: "/new-nonce", handler: empty
});

directoryService.addField("new-account", {
  method: "post", path: "/new-account", handler: newAccount
});

const port = 3000;
const server = express();

server.use(bodyParser.json());
server.use(newNonce({nonceService}));
server.use(joseVerify({joseService}));
server.use(useNonce({nonceService}));

server.get("/directory", directory({directoryService}));

directoryService.each((_, {method, path, handler}) => {
  server[method](path, handler);
});

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
