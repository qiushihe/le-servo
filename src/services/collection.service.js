import Promise from "bluebird";
import find from "lodash/fp/find";
import reduce from "lodash/fp/reduce";
import assign from "lodash/fp/assign";

import RecordService from "src/services/record.service";

const emptyCollections = reduce((result, {name, attributes}) => ({
  ...result,
  [name]: new RecordService({attributes})
}), {});

class CollectionService {
  constructor(options) {
    const {
      records
    } = assign({
      records: [
        // { name: "books",
        //   attributes: [{name: "title", defaultValue: "A book title"},
        //                {name: "score", defaultValue: 0}]}
      ]
    })(options || {});

    this.records = records;
    this.collections = emptyCollections(this.records);
  }

  connect() {
    return Promise.resolve();
  }

  get(name) {
    return new Promise((resolve, reject) => {
      if (!this.collections[name]) {
        const attributes = find({name})(this.records);
        if (attributes) {
          this.collections[name] = new RecordService({attributes});
        }
      }

      if (!this.collections[name]) {
        reject(new Error(`Collection not found with name: ${name}`));
      } else {
        resolve(this.collections[name]);
      }
    });
  }

  clear() {
    return Promise.resolve().then(() => {
      this.collections = emptyCollections(this.records);
    });
  }
}

export default CollectionService;
