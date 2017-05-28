import Promise from "bluebird";
import flow from "lodash/fp/flow";
import isEmpty from "lodash/fp/isEmpty";
import {JWK, JWS, util as joseUtil} from "node-jose";

class JoseService {
  constructor() {
    this.keystore = JWK.createKeyStore();
  }

  verify(jws = {}) {
    return Promise.resolve().then(() => {
      const {
        protected: protectedHeader,
        payload,
        signature
      } = jws;

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

      if (isEmpty(alg) || isEmpty(nonce) || isEmpty(url)) {
        throw new Error("Invalid header: Must have alg, nonce and url");
      }

      if (!isEmpty(kid)) {
        const key = this.keystore.get(kid);
        if (isEmpty(key)) {
          throw new Error("Invalid header: Key not found for provided kid");
        } else {
          return key;
        }
      } else {
        return this.keystore.add(jwk);
      }
    }).then(
      (key) => JWS.createVerify(key).verify(jws)
    ).then((result) => ({
      ...result,
      payload: JSON.parse(result.payload)
    }));
  }
}

export default JoseService;
