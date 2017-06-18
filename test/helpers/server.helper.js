import express from "express";
import bodyParser from "body-parser";
import Promise from "bluebird";

export const getRansomPort = () => {
  return Math.floor(Math.random() * (9000 - 7000 + 1)) + 7000;
};

export const getServer = ({
  port,
  parser,
  setup
}) => {
  const server = express();

  if (parser) {
    server.use(bodyParser[parser]());
  }

  setup(server);

  let _listener;
  const _port = port || getRansomPort();
  const _ready = new Promise((resolve) => {
    _listener = server.listen(_port, resolve);
  });

  return {
    getPort: () => {
      return _port;
    },
    getReady: () => {
      return _ready;
    },
    close: (done) => {
      if (_listener) {
        _listener.close(done);
      } else {
        done();
      }
    }
  };
};
