import {GetNonceService} from "services/default.services";

export default (_, res, next) => {
  GetNonceService().getNonce().then((nonce) => {
    res.set("Replay-Nonce", nonce);
    next();
  });
};
