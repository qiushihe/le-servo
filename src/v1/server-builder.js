import bodyParser from "body-parser";

import NonceService from "src/services/nonce.service";
import JoseService from "src/services/jose.service";
import DirectoryService from "src/services/directory.service";
import CollectionService from "src/services/collection.service";
import AccountService from "src/services/account.service";
import ChallengeService from "src/services/challenge.service";
import AuthorizationService from "src/services/authorization.service";
import OrderService from "src/services/order.service";

import logging from "src/filters/logging.filter";
import newNonce from "src/filters/new-nonce.filter";
import joseVerify from "src/filters/jose-verify.filter";
import useNonce from "src/filters/use-nonce.filter";

import directory from "src/handlers/directory.handler";
import newAccount from "src/handlers/account/new-account.handler";
import updateAccount from "src/handlers/account/update-account.handler";
import newAuthorization from "src/handlers/authorization/new-authorization.handler";
import getAuthorization from "src/handlers/authorization/get-authorization.handler";
import respondToChallenge from "src/handlers/challenge/respond-to-challenge.handler";
import getChallenge from "src/handlers/challenge/get-challenge.handler";

export default ({origin, nonceBufferSize, suppressLogging}) => (server) => {
  const nonceService = new NonceService({bufferSize: nonceBufferSize});
  const joseService = new JoseService();
  const directoryService = new DirectoryService({origin});
  const collectionService = new CollectionService({
    records: [
      {...AccountService.storageAttributes},
      {...AuthorizationService.storageAttributes},
      {...ChallengeService.storageAttributes},
      {...OrderService.storageAttributes}
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

  // TODO: Implement validation of `resource` attribute from request payload

  directoryService.addField("new-reg", {
    method: "post",
    path: "/new-reg",
    handler: newAccount({directoryService, accountService, v1: true})
  });

  directoryService.addField("new-authz", {
    method: "post",
    path: "/new-authz",
    handler: newAuthorization({
      accountService,
      authorizationService,
      challengeService,
      directoryService,
      v1: true
    })
  });

  directoryService.addField("new-cert", {
    method: "post",
    path: "/new-cert",
    handler: (req, res) => {
      console.log("** new-cert", req.body);
      res.status(204).end();
    }
  });

  directoryService.addField("revoke-cert", {
    method: "post",
    path: "/revoke-cert",
    handler: (req, res) => {
      console.log("** revoke-cert", req.body);
      res.status(204).end();
    }
  });

  // TODO: Better parse the "application/jose+json" type
  server.use(bodyParser.json({ type: () => true }));

  if (!suppressLogging) {
    server.use(logging({logHeaders: true}));
  }

  server.use(newNonce({nonceService}));
  server.use(joseVerify({joseService, v1: true}));
  server.use(useNonce({nonceService}));

  server.get("/directory", directory({directoryService}));

  directoryService.each((_, {method, path, handler}) => {
    server[method](path, handler);
  });

  server.post("/accounts/:accound_id", updateAccount({
    directoryService,
    accountService,
    v1: true
  }));

  server.get("/authz/:authorization_id", getAuthorization({
    challengeService,
    authorizationService,
    orderService,
    accountService,
    directoryService,
    v1: true
  }));

  server.post("/authz/:authorization_id/:challenge_id", respondToChallenge({
    challengeService,
    authorizationService,
    orderService,
    accountService,
    directoryService,
    v1: true
  }));

  server.get("/authz/:authorization_id/:challenge_id", getChallenge({
    challengeService,
    authorizationService,
    orderService,
    accountService,
    directoryService,
    v1: true
  }));

  return server;
};
