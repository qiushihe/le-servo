import express from "express";

import serverBuilder from "./server-builder";

const port = 3000;

const buildServer = serverBuilder({
  origin: `http://localhost:${port}`,
  nonceBufferSize: 32
});

const server = buildServer(express());

server.listen(port, () => {
  console.log(`Server started on port ${port}`); // eslint-disable-line
});
