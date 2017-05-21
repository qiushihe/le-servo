import NonceService from "services/nonce.service";

export default (_, res, next) => {
  NonceService.GetDefaultInstance().getNonce().then((nonce) => {
    res.set("Replay-Nonce", nonce);
    next();
  });
};
