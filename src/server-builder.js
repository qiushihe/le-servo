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
import OrderService from "src/services/order.service";

import logging from "src/filters/logging.filter";
import newNonce from "src/filters/new-nonce.filter";
import joseVerify from "src/filters/jose-verify.filter";
import useNonce from "src/filters/use-nonce.filter";

import empty from "src/handlers/empty.handler";
import directory from "src/handlers/directory.handler";
import newAccount from "src/handlers/account/new-account.handler";
import updateAccount from "src/handlers/account/update-account.handler";
import newOrder from "src/handlers/order/new-order.handler";
import getOrder from "src/handlers/order/get-order.handler";
import getOrders from "src/handlers/order/get-orders.handler";
import respondToChallenge from "src/handlers/challenge/respond-to-challenge.handler";
import getChallenge from "src/handlers/challenge/get-challenge.handler";
import getAuthorization from "src/handlers/authorization/get-authorization.handler";

import {handleRequest} from "src/helpers/server.helper";

const getOrigin = get("origin");
const getNonceBufferSize = get("nonceBufferSize");
const getSuppressLogging = get("suppressLogging");
const getDbEngine = get("dbOptions.engine");
const getDbConnectionUrl = get("dbOptions.connectionUrl");
const getRootCertPem = get("rootCertificate.pem");
const getRootCertKey = get("rootCertificate.key");

export default (options) => (server) => {
  const origin = getOrigin(options);
  const nonceBufferSize = getNonceBufferSize(options);
  const suppressLogging = getSuppressLogging(options);

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
      {...OrderService.storageAttributes}
    ]
  });

  const workerService = new WorkerService({
    storage: storageService,
    workers: {
      "verifyTlsSni01": require.resolve("./workers/verify-tls-sni-01.worker"),
      "verifyHttp01": require.resolve("./workers/verify-http-01.worker"),
      "signCertificate": require.resolve("./workers/sign-certificate.worker")
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

  const orderService = new OrderService({
    authorizationService,
    storage: storageService
  });

  directoryService.addField("new-nonce", {
    method: "all",
    path: "/new-nonce",
    handler: handleRequest(empty)
  });

  directoryService.addField("new-account", {
    method: "post",
    path: "/new-account",
    handler: handleRequest(newAccount, {directoryService, accountService})
  });

  directoryService.addField("new-order", {
    method: "post",
    path: "/new-order",
    handler: handleRequest(newOrder, {
      accountService,
      orderService,
      authorizationService,
      directoryService
    })
  });

  server.use(bodyParser.json());

  if (!suppressLogging) {
    server.use(logging({}));
  }

  server.use(newNonce({nonceService}));
  server.use(joseVerify({joseService}));
  server.use(useNonce({nonceService}));

  server.get("/directory", handleRequest(directory, {directoryService}));

  directoryService.each((_, {method, path, handler}) => {
    server[method](path, handler);
  });

  server.post("/accounts/:accound_id", handleRequest(updateAccount, {
    directoryService,
    accountService
  }));

  server.get("/accounts/:accound_id/orders", handleRequest(getOrders, {
    accountService,
    orderService,
    directoryService
  }));

  server.get("/order/:order_id", handleRequest(getOrder, {
    accountService,
    orderService,
    authorizationService,
    directoryService
  }));

  server.get("/authz/:authorization_id", handleRequest(getAuthorization, {
    challengeService,
    authorizationService,
    orderService,
    accountService,
    directoryService
  }));

  server.post("/authz/:authorization_id/:challenge_id", handleRequest(respondToChallenge, {
    challengeService,
    authorizationService,
    orderService,
    accountService,
    workerService,
    directoryService
  }));

  server.get("/authz/:authorization_id/:challenge_id", handleRequest(getChallenge, {
    challengeService,
    authorizationService,
    orderService,
    accountService,
    directoryService
  }));

  return storageService.connect().then(() => {
    return server;
  });
};
