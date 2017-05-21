import {JWS} from "node-jose";

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
