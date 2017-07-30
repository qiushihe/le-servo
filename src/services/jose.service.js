import Promise from "bluebird";
import flow from "lodash/fp/flow";
import isEmpty from "lodash/fp/isEmpty";
import {JWK, JWS, util as joseUtil} from "node-jose";

class JoseService {
  constructor() {
    this.keystore = JWK.createKeyStore();
  }

  verify(jws, {v1 = false} = {}) {
    return Promise.resolve().then(() => {
      const {
        protected: protectedHeader,
        payload,
        signature
      } = (jws || {});

      if (isEmpty(protectedHeader) || isEmpty(payload) || isEmpty(signature)) {
        throw new Error("Invalid JWS");
      }

      const {
        alg,
        jwk,
        kid,
        nonce,
        url
      } = flow([
        joseUtil.base64url.decode,
        joseUtil.utf8.encode,
        JSON.parse
      ])(protectedHeader);

      if (isEmpty(kid) && isEmpty(jwk)) {
        throw new Error("Invalid header: Missing either kid or jwk");
      }

      if (!isEmpty(kid) && !isEmpty(jwk)) {
        throw new Error("Invalid header: Can not have both kid and jwk");
      }

      if (v1) {
        if (isEmpty(alg) || isEmpty(nonce)) {
          throw new Error("Invalid header: Must have alg and nonce");
        }
      } else {
        if (isEmpty(alg) || isEmpty(nonce) || isEmpty(url)) {
          throw new Error("Invalid header: Must have alg, nonce and url");
        }
      }

      if (!isEmpty(kid)) {
        const key = this.keystore.get(kid);
        if (isEmpty(key)) {
          throw new Error("Invalid header: Key not found for provided kid");
        } else {
          return key;
        }
      } else {
        return JWK.asKey(jwk);
      }
    }).then(
      (key) => JWS.createVerify(key).verify(jws)
    ).then((result) => ({
      ...result,
      payload: JSON.parse(result.payload)
    }));
  }

  addKey(key) {
    const {kid} = key;
    const existingKey = this.keystore.get(kid);
    return isEmpty(existingKey)
      ? this.keystore.add(key)
      : Promise.resolve(existingKey);
  }
}

export default JoseService;
