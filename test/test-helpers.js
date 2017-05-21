import Promise from "bluebird";
import {JWS} from "node-jose";

// Async test =====================================================================================

export const async = (test) => (done) => {
  Promise.resolve().then(test).then(done).catch(done);
};

// JWS Signing ====================================================================================

export const createJwsSign = (fields, key, {hasJwk, hasKid}) => {
  if (hasJwk && hasKid) {
    return JWS.createSign(
      {format: "flattened", fields: {...fields, jwk: key.toJSON()}},
      {reference: "kid", key}
    );
  }

  if (hasJwk && !hasKid) {
    return JWS.createSign(
      {format: "flattened", fields: {...fields, jwk: key.toJSON()}},
      {reference: null, key}
    );
  }

  if (!hasJwk && hasKid) {
    return JWS.createSign(
      {format: "flattened", fields: {...fields}},
      {reference: "kid", key}
    );
  }

  if (!hasJwk && !hasKid) {
    return JWS.createSign(
      {format: "flattened", fields: {...fields}},
      {reference: null, key}
    );
  }
};

export const signWithJws = (header, payload, {hasJwk, hasKid}) => (key) => {
  return createJwsSign(header, key, {hasJwk, hasKid})
    .update(JSON.stringify(payload))
    .final();
};

// Server test ====================================================================================

export const getRansomPort = () => {
  return Math.floor(Math.random() * (9000 - 7000 + 1)) + 7000;
};
