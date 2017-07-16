import express from "express";
import bodyParser from "body-parser";

import NonceService from "src/services/nonce.service";
import JoseService from "src/services/jose.service";
import DirectoryService from "src/services/directory.service";
import CollectionService from "src/services/collection.service";
import AccountService from "src/services/account.service";
import ChallengeService from "src/services/challenge.service";
import AuthorizationService from "src/services/authorization.service";
import OrderService from "src/services/order.service";

import newNonce from "src/filters/new-nonce.filter";
import joseVerify from "src/filters/jose-verify.filter";
import useNonce from "src/filters/use-nonce.filter";

import empty from "src/handlers/empty.handler";
import directory from "src/handlers/directory.handler";
import newAccount from "src/handlers/account/new-account.handler";
import updateAccount from "src/handlers/account/update-account.handler";
import newOrder from "src/handlers/order/new-order.handler";

const nonceService = new NonceService({bufferSize: 32});
const joseService = new JoseService();
const directoryService = new DirectoryService({origin: "http://localhost:3000"});
const collectionService = new CollectionService({
  records: [
    {...AccountService.storageAttributes}
  ]
});

const accountService = new AccountService({
  joseService,
  storage: collectionService
});

const challengeService = new ChallengeService({
  storage: collectionService
});

const authorizationService = new AuthorizationService({
  challengeService,
  storage: collectionService
});

const orderService = new OrderService({
  authorizationService,
  storage: collectionService
});

directoryService.addField("new-nonce", {
  method: "all",
  path: "/new-nonce",
  handler: empty
});

directoryService.addField("new-account", {
  method: "post",
  path: "/new-account",
  handler: newAccount({
    directoryService,
    accountService
  })
});

directoryService.addField("new-order", {
  method: "post",
  path: "/new-order",
  handler: newOrder({
    accountService,
    orderService,
    authorizationService,
    directoryService
  })
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

server.post("/accounts/:accound_id", updateAccount({directoryService, accountService}));

server.listen(port, () => {
  console.log(`Server started on port ${port}`); // eslint-disable-line
});
