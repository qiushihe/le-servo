import express from "express";

import serverBuilder from "./server-builder";

const hostName = process.env.LE_SERVO_HOST_NAME || "localhost";
const pathPrefix = process.env.LE_SERVO_PATH_PREFIX || "";
const port = process.env.LE_SERVO_PORT || 3000;
const nonceBufferSize = process.env.LE_SERVO_NONCE_BUFFER_SIZE || 32;

const origin = `http://${hostName}:${port}${pathPrefix}`;

const buildServer = serverBuilder({
  origin,
  nonceBufferSize
});

buildServer(express()).listen(port, () => {
  console.log(`Server started on ${origin}`); // eslint-disable-line
});
