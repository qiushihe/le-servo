import Promise from "bluebird";
import reduce from "lodash/fp/reduce";

import RecordService from "services/record.service";

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

    this.collections = reduce((result, {name, attributes}) => ({
      ...result,
      [name]: new RecordService({attributes})
    }), {})(this.records);
  }

  get(name) {
    return new Promise((resolve, reject) => {
      const collection = this.collections[name];
      if (collection) {
        resolve(collection);
      } else {
        reject(new Error(`Collection not found with name: ${name}`));
      }
    });
  }
}

export default CollectionService;
