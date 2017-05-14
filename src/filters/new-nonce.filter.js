export default (server) => server.get("/*", (_, res, next) => {
  res.set("Replay-Nonce", "42");
  next();
});
