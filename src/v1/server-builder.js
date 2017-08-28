import get from "lodash/fp/get";
import bodyParser from "body-parser";

import StorageService from "src/services/storage";
import WorkerService from "src/services/worker.service";
import NonceService from "src/services/nonce.service";
import JoseService from "src/services/jose.service";
import DirectoryService from "src/services/directory.service";
import AccountService from "src/services/account.service";
import ChallengeService from "src/services/challenge.service";
import AuthorizationService from "src/services/authorization.service";
import CertificateService from "src/services/certificate.service";

import logging from "src/filters/logging.filter";
import newNonce from "src/filters/new-nonce.filter";
import joseVerify from "src/filters/jose-verify.filter";
import useNonce from "src/filters/use-nonce.filter";

import empty from "src/handlers/empty.handler";
import directory from "src/handlers/directory.handler";
import newAccount from "src/v1/proxies/new-account-handler.proxy";
import updateAccount from "src/v1/proxies/update-account-handler.proxy";
import newAuthorization from "src/v1/proxies/new-authorization-handler.proxy";
import getAuthorization from "src/v1/proxies/get-authorization-handler.proxy";
import respondToChallenge from "src/v1/proxies/respond-to-challenge-handler.proxy";
import getChallenge from "src/v1/proxies/get-challenge-handler.proxy";
import newCertificate from "src/v1/handlers/certificate/new-certificate.handler";
import getAcceptedCertificate from "src/v1/handlers/certificate/get-accepted-certificate.handler";
import getCertificate from "src/v1/handlers/certificate/get-certificate.handler";
import renewCertificate from "src/v1/handlers/certificate/renew-certificate.handler";

import {handleRequest} from "src/helpers/server.helper";

const getOrigin = get("origin");
const getNonceBufferSize = get("nonceBufferSize");
const getSuppressLogging = get("suppressLogging");
const getDbEngine = get("dbOptions.engine");
const getDbConnectionUrl = get("dbOptions.connectionUrl");
const getRootCertPem = get("rootCertificate.pem");
const getRootCertKey = get("rootCertificate.key");

// Due to the unique way Certbot is implemented (read: "not according to specs"; See this
// discussion for detail: https://github.com/certbot/certbot/issues/4389) it does not
// support the deferred certificate creation flow (i.e. responding with 202 Accepted).
// So here we accept this option so that deferred certificated creation flow can be optionally
// enabled within environments where there would not be any ACEM clients that doesn't support
// this feature (i.e. in a closed network where all clients are Traefik).
const getDeferredCertGen = get("deferredCertGen");

export default (options) => (server) => {
  const origin = getOrigin(options);
  const nonceBufferSize = getNonceBufferSize(options);
  const suppressLogging = getSuppressLogging(options);
  const deferredCertGen = getDeferredCertGen(options);

  const nonceService = new NonceService({bufferSize: nonceBufferSize});
  const joseService = new JoseService();
  const directoryService = new DirectoryService({origin});

  const storageService = StorageService({
    engine: getDbEngine(options),
    connectionUrl: getDbConnectionUrl(options),
    storageAttributes: [
      {...AccountService.storageAttributes},
      {...AuthorizationService.storageAttributes},
      {...ChallengeService.storageAttributes},
      {...CertificateService.storageAttributes}
    ]
  });

  const workerService = new WorkerService({
    storage: storageService,
    workers: {
      "verifyTlsSni01": require.resolve("../workers/verify-tls-sni-01.worker"),
      "verifyHttp01": require.resolve("../workers/verify-http-01.worker"),
      "signCertificate": require.resolve("../workers/sign-certificate.worker")
    },
    workerOptions: {
      storage: storageService,
      storageOptions: storageService.getOptions(),
      rootCertificate: {
        pem: getRootCertPem(options),
        key: getRootCertKey(options)
      }
    }
  });

  const accountService = new AccountService({
    joseService,
    storage: storageService
  });

  const challengeService = new ChallengeService({
    storage: storageService
  });

  const authorizationService = new AuthorizationService({
    challengeService,
    storage: storageService
  });

  const certificateService = new CertificateService({
    authorizationService,
    storage: storageService,
    rootCertPem: getRootCertPem(options),
    rootCertKey: getRootCertKey(options)
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
      workerService,
      directoryService,
      deferredCertGen
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

  server.head("*", handleRequest(empty));

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
    workerService,
    directoryService
  }));

  server.get("/authz/:authorization_id/:challenge_id", handleRequest(getChallenge, {
    challengeService,
    authorizationService,
    accountService,
    directoryService
  }));

  server.get("/cert/accepted/:certificate_id", handleRequest(getAcceptedCertificate, {
    accountService,
    authorizationService,
    certificateService,
    directoryService
  }));

  server.get("/cert/:certificate_id", handleRequest(getCertificate, {
    accountService,
    authorizationService,
    certificateService,
    directoryService
  }));

  server.get("/cert/renew/:authorization_id", handleRequest(renewCertificate, {
    accountService,
    authorizationService,
    certificateService,
    workerService,
    directoryService,
    deferredCertGen
  }));

  return storageService.connect().then(() => {
    return server;
  });
};
