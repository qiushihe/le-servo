export default ({nonceService}) => (_, res, next) => {
  nonceService.getNonce().then((nonce) => {
    res.set("Replay-Nonce", nonce);
    next();
  });
};
