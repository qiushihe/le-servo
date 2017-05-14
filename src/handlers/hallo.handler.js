export default (server) => {
  server.get("/", (_, res) => {
    res.send("Hallo!");
  });

  server.post("/hallo", (req) => {
    res.send("Hallo!");
  });

  return server;
};
