import bodyParser from "body-parser";

import NonceService from "src/services/nonce.service";
import JoseService from "src/services/jose.service";
import DirectoryService from "src/services/directory.service";
import CollectionService from "src/services/collection.service";
import AccountService from "src/services/account.service";
import ChallengeService from "src/services/challenge.service";
import AuthorizationService from "src/services/authorization.service";
import CertificateService from "src/services/certificate.service";

import logging from "src/filters/logging.filter";
import newNonce from "src/filters/new-nonce.filter";
import joseVerify from "src/filters/jose-verify.filter";
import useNonce from "src/filters/use-nonce.filter";

import directory from "src/handlers/directory.handler";
import newAccount from "src/v1/proxies/new-account-handler.proxy";
import updateAccount from "src/v1/proxies/update-account-handler.proxy";
import newAuthorization from "src/v1/proxies/new-authorization-handler.proxy";
import getAuthorization from "src/v1/proxies/get-authorization-handler.proxy";
import respondToChallenge from "src/v1/proxies/respond-to-challenge-handler.proxy";
import getChallenge from "src/v1/proxies/get-challenge-handler.proxy";
import newCertificate from "src/v1/handlers/certificate/new-certificate.handler";

import {handleRequest} from "src/helpers/server.helper";

export default ({origin, nonceBufferSize, suppressLogging}) => (server) => {
  const nonceService = new NonceService({bufferSize: nonceBufferSize});
  const joseService = new JoseService();
  const directoryService = new DirectoryService({origin});
  const collectionService = new CollectionService({
    records: [
      {...AccountService.storageAttributes},
      {...AuthorizationService.storageAttributes},
      {...ChallengeService.storageAttributes},
      {...CertificateService.storageAttributes}
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

  const certificateService = new CertificateService({
    storage: collectionService
  });

  // TODO: Implement validation of `resource` attribute from request payload

  directoryService.addField("new-reg", {
    method: "post",
    path: "/new-reg",
    handler: handleRequest(newAccount, {directoryService, accountService})
  });

  directoryService.addField("new-authz", {
    method: "post",
    path: "/new-authz",
    handler: handleRequest(newAuthorization, {
      accountService,
      authorizationService,
      challengeService,
      directoryService
    })
  });

  directoryService.addField("new-cert", {
    method: "post",
    path: "/new-cert",
    handler: handleRequest(newCertificate, {
      accountService,
      authorizationService,
      certificateService,
      directoryService
    })
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

  server.get("/directory", handleRequest(directory, {directoryService}));

  directoryService.each((_, {method, path, handler}) => {
    server[method](path, handler);
  });

  server.post("/accounts/:accound_id", handleRequest(updateAccount, {
    directoryService,
    accountService
  }));

  server.get("/authz/:authorization_id", handleRequest(getAuthorization, {
    challengeService,
    authorizationService,
    accountService,
    directoryService
  }));

  server.post("/authz/:authorization_id/:challenge_id", handleRequest(respondToChallenge, {
    challengeService,
    authorizationService,
    accountService,
    directoryService
  }));

  server.get("/authz/:authorization_id/:challenge_id", handleRequest(getChallenge, {
    challengeService,
    authorizationService,
    accountService,
    directoryService
  }));

  server.get("/cert/:certificate_id", (req, res) => {
    console.log("** get-cert", req.params.certificate_id);
    res.status(204).end();
  });

  return server;
};