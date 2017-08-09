import uuidV4 from "uuid/v4";
import map from "lodash/fp/map";
import Promise from "bluebird";

import {parseCsr} from "src/helpers/certificate.helper";

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

  filter(query) {
    return this.storage.get("orders").then((orders) => {
      return orders.filter(query);
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
      });
    }).then((order) => {
      return parseCsr(csr).then(({domains}) => {
        return map((domain) => (
          this.authorizationService.create({
            orderId: order.id,
            identifierValue: domain
          })
        ))(domains);
      })
      .then(Promise.all)
      .then(() => order);
    });
  }

  update(id, {status}) {
    return this.storage.get("orders").then((orders) => {
      return orders.update(id, {status});
    });
  }
}

OrderService.storageAttributes = {
  name: "orders",
  attributes: [
    {name: "accountId", defaultValue: null},
    {name: "status", defaultValue: "pending"},
    {name: "expires", defaultValue: null},
    {name: "csr", defaultValue: null},
    {name: "notBefore", defaultValue: null},
    {name: "notAfter", defaultValue: null},
    {name: "error", defaultValue: null}
  ]
};

export default OrderService;
