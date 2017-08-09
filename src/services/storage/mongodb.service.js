import Promise from "bluebird";
import assign from "lodash/fp/assign";
import find from "lodash/fp/find";
import map from "lodash/fp/map";
import reduce from "lodash/fp/reduce";
import isEmpty from "lodash/fp/isEmpty";
import isFunction from "lodash/fp/isFunction";
import isUndefined from "lodash/fp/isUndefined";
import first from "lodash/fp/first";
import {MongoClient} from "mongodb";

const recordWithId = (record) => {
  if (record) {
    const {_id, ...recordAttributes} = record;
    return {...recordAttributes, id: _id};
  } else {
    return record;
  }
};

class MongoDBCollectionService {
  constructor(collection, options) {
    const {
      attributes
    } = assign({
      attributes: [
        // {name: "title", defaultValue: "A record title"},
        // {name: "score", defaultValue: 0}
      ]
    })(options || {});

    this.collection = collection;
    this.attributes = attributes;
    this.attributeNames = map("name")(this.attributes);
  }

  find(query) {
    return this.collection.findOne(query).then(recordWithId);
  }

  filter(query) {
    return this.collection.find(query).toArray().then(map(recordWithId));
  }

  get(id) {
    return this.collection.findOne({_id: id}).then((record) => {
      if (!record) {
        throw new Error(`Record not found with id: ${id}`);
      } else {
        return recordWithId(record);
      }
    });
  }

  create(id) {
    return this.collection.insertOne({
      ...reduce((result, {name, defaultValue}) => ({
        ...result,
        [name]: isFunction(defaultValue) ? defaultValue(result) : defaultValue
      }), {})(this.attributes),
      _id: id
    }).then(({ops}) => recordWithId(first(ops)));
  }

  update(id, payload) {
    return this.collection.findOne({_id: id}).then((record) => {
      if (!record) {
        throw new Error(`Record not found with id: ${id}`);
      }

      const update = reduce((result, attributeName) => (
        isUndefined(payload[attributeName])
          ? result
          : {...result, [attributeName]: payload[attributeName]}
      ), {})(this.attributeNames);

      if (!isEmpty(update)) {
        return this.collection.updateOne({_id: id}, {$set: update}).then(() => {
          return this.collection.findOne({_id: id}).then(recordWithId);
        });
      } else {
        return recordWithId(record);
      }
    });
  }

  remove(id) {
    return this.collection.findOne({_id: id}).then((record) => {
      if (!record) {
        throw new Error(`Record not found with id: ${id}`);
      } else {
        return this.collection.deleteOne({_id: id}).then(() => {
          return recordWithId(record);
        });
      }
    });
  }
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
      const {attributes} = find({name})(this.collectionOptions) || {};
      return new MongoDBCollectionService(collection, {attributes});
    });
  }

  clear() {
    return this.db.dropDatabase();
  }
}

export default MongoDBService;
