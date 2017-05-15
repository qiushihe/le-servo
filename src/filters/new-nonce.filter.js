import NonceService from "services/nonce.service";

export default (server) => server.get("/*", (_, res, next) => {
  NonceService.GetDefaultInstance().getNonce().then((nonce) => {
    res.set("Replay-Nonce", nonce);
    next();
  });
});
