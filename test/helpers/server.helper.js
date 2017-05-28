import express from "express";
import bodyParser from "body-parser";
import Promise from "bluebird";

export const getRansomPort = () => {
  return Math.floor(Math.random() * (9000 - 7000 + 1)) + 7000;
};

export const getServer = ({
  port,
  bodyParser: parser,
  setup
}) => {
  const server = express();

  if (parser) {
    server.use(bodyParser[parser]());
  }

  setup(server);

  return {
    port,
    ready: new Promise((resolve) => {
      server.listen(port, resolve);
    })
  };
};
