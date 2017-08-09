import Promise from "bluebird";
import assign from "lodash/fp/assign";
import find from "lodash/fp/find";
import {MongoClient} from "mongodb";

class MongoCollectionService {
  constructor(collection, options = {}) {
    this.collection = collection;
    this.options = options;
  }

  // find
  // filter
  // get
  // create
  // update
  // remove
}

class MongoDBService {
  constructor(options) {
    const {
      connectionUrl,
      collectionOptions
    } = assign({
      connectionUrl: "mongodb://localhost:27017/le-servo-dev",
      collectionOptions: [
        // { name: "books",
        //   attributes: [{name: "title", defaultValue: "A book title"},
        //                {name: "score", defaultValue: 0}]}
      ]
    })(options || {});

    this.connectionUrl = connectionUrl;
    this.collectionOptions = collectionOptions;
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.connectionUrl, (err, db) => {
        if (err) {
          reject(err);
        } else {
          this.db = db;
          resolve();
        }
      });
    });
  }

  get(name) {
    return Promise.resolve().then(() => {
      const collection = this.db.collection(name);
      const options = find({name})(this.collectionOptions);
      return new MongoCollectionService(collection, options);
    });
  }
}

export default MongoDBService;
