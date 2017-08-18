import express from "express";
import isEmpty from "lodash/fp/isEmpty";
import {pki as PKI} from "node-forge";

import {generateDummyRootCertificateAndKey} from "src/helpers/certificate.helper";

import serverBuilder from "./server-builder";

const hostName = process.env.LE_SERVO_HOST_NAME || "localhost";
const pathPrefix = process.env.LE_SERVO_PATH_PREFIX || "";
const port = process.env.LE_SERVO_PORT || 3000;
const nonceBufferSize = process.env.LE_SERVO_NONCE_BUFFER_SIZE || 1024;
const dbEngine = process.env.LE_SERVO_DB_ENGINE || "internaldb";
const dbConnectionUrl = process.env.LE_SERVO_DB_CONNECTION_URL || "";
const rootCertPem = process.env.LE_SERVO_ROOT_CERT_PEM || "";
const rootCertKey = process.env.LE_SERVO_ROOT_CERT_KEY || "";

let origin = `http://${hostName}:${port}${pathPrefix}`;
if (`${port}` === "80") {
  origin = `http://${hostName}${pathPrefix}`;
} else if (`${port}` === "443") {
  origin = `https://${hostName}${pathPrefix}`;
}

const rootCertificate = {
  pem: rootCertPem,
  key: rootCertKey
};

if (isEmpty(rootCertificate.pem) || isEmpty(rootCertificate.key)) {
  const {
    certificate: dummyCertificate,
    privateKey: dummyPrivateKey
  } = generateDummyRootCertificateAndKey();
  rootCertificate.pem = PKI.certificateToPem(dummyCertificate);
  rootCertificate.key = PKI.privateKeyToPem(dummyPrivateKey);
  console.log("No root certificate and key specified; Using generated dummy certificate and key.");
}

const buildServer = serverBuilder({
  origin,
  nonceBufferSize,
  dbOptions: {
    engine: dbEngine,
    connectionUrl: dbConnectionUrl
  },
  rootCertificate
});

buildServer(express()).then((server) => {
  server.listen(port, () => {
    console.log(`Server started on ${origin}`);
  });
});
