import express from "express";
import flow from "lodash/fp/flow";

import newNonce from "filters/new-nonce.filter";
import hallo from "handlers/hallo.handler";

const port = 3000;

const filters = [
  newNonce
];

const handlers = [
  hallo
];

const listener = (server) => server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

flow([...filters, ...handlers, listener])(express());
