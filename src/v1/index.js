import express from "express";

import serverBuilder from "./server-builder";

const hostName = process.env.LE_SERVO_HOST_NAME || "localhost";
const pathPrefix = process.env.LE_SERVO_PATH_PREFIX || "";
const port = process.env.LE_SERVO_PORT || 3000;
const nonceBufferSize = process.env.LE_SERVO_NONCE_BUFFER_SIZE || 32;
const dbEngine = process.env.LE_SERVO_DB_ENGINE || "internal";
const dbConnectionUrl = process.env.LE_SERVO_DB_CONNECTION_URL || "";

let origin = `http://${hostName}:${port}${pathPrefix}`;
if (`${port}` === "80") {
  origin = `http://${hostName}${pathPrefix}`;
} else if (`${port}` === "443") {
  origin = `https://${hostName}${pathPrefix}`;
}

const buildServer = serverBuilder({
  origin,
  nonceBufferSize,
  dbOptions: {
    engine: dbEngine,
    connectionUrl: dbConnectionUrl
  }
});

buildServer(express()).then((server) => {
  server.listen(port, () => {
    console.log(`Server started on ${origin}`); // eslint-disable-line
  });
});
