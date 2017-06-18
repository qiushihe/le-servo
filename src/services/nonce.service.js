import Promise from "bluebird";
import times from "lodash/fp/times";
import includes from "lodash/fp/includes";
import uuidV4 from "uuid/v4";

import {isPositiveNumber} from "src/helpers/number.helper";
import {isValid} from "src/helpers/nonce.helper";

const DEFAULT_USED_BUFFER_SIZE = 32;

const initializeBuffer = (size, value = null) => times(value)(
  isPositiveNumber(size) ? size : DEFAULT_USED_BUFFER_SIZE
);

class NonceService {
  constructor({bufferSize} = {}) {
    this.usedBuffer = initializeBuffer(bufferSize);
  }

  getNonce() {
    return Promise.resolve(uuidV4());
  }

  useNonce(nonce = "") {
    const nonceValue = `${nonce}`.trim();

    if (!isValid(nonceValue) || includes(nonceValue)(this.usedBuffer)) {
      return Promise.reject();
    } else {
      this.usedBuffer.push(nonceValue);
      this.usedBuffer.shift();

      return Promise.resolve();
    }
  }
}

export default NonceService;
