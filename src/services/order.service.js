import uuidV4 from "uuid/v4";

class OrderService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    this.storage = options.storage;
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
