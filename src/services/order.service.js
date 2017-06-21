import uuidV4 from "uuid/v4";
import map from "lodash/fp/map";
import Promise from "bluebird";

import {parseCsr} from "src/helpers/csr.helper";

class OrderService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    if (!options.authorizationService) {
      throw new Error("Missing authorization service");
    }

    this.storage = options.storage;
    this.authorizationService = options.authorizationService;
  }

  find(query) {
    return this.storage.get("orders").then((orders) => {
      return orders.find(query);
    });
  }

  get(id) {
    return this.storage.get("orders").then((orders) => {
      return orders.get(id);
    });
  }

  create({accountId, csr, notBefore, notAfter}) {
    return this.storage.get("orders").then((orders) => {
      return orders.create(uuidV4()).then(({id}) => {
        return orders.update(id, {accountId, csr, notBefore, notAfter});
      }).then(({id}) => {
        return flow([
          parseCsr,
          map((domain) => this.authorizationService.create({
            orderId: id,
            identifierValue: domain,
            token: uuidV4().replace(/-/g, "")
          })),
          (promises) => Promise.all(promises)
        ])(csr);
      });
    });
  }

  update(id, {status}) {
    return this.storage.get("orders").then((orders) => {
      return orders.update(id, {status});
    });
  }
}

export default OrderService;
