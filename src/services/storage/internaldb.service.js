import Promise from "bluebird";
import assign from "lodash/fp/assign";
import map from "lodash/fp/map";
import reduce from "lodash/fp/reduce";
import flow from "lodash/fp/flow";
import values from "lodash/fp/values";
import find from "lodash/fp/find";
import filter from "lodash/fp/filter";
import isUndefined from "lodash/fp/isUndefined";
import isEmpty from "lodash/fp/isEmpty";
import isFunction from "lodash/fp/isFunction";
import cloneDeep from "lodash/fp/cloneDeep";

export class InternalDBCollectionService {
  constructor(options) {
    const {
      attributes
    } = assign({
      attributes: [
        // {name: "title", defaultValue: "A record title"},
        // {name: "score", defaultValue: 0}
      ]
    })(options || {});

    this.attributes = attributes;
    this.attributeNames = map("name")(this.attributes);

    this.records = {};
  }

  find(query) {
    return new Promise((resolve) => {
      const record = flow([
        values,
        find(query)
      ])(this.records);

      if (record) {
        resolve(cloneDeep(record));
      } else {
        resolve(null);
      }
    });
  }

  filter(query) {
    return new Promise((resolve) => {
      const records = flow([
        values,
        filter(query),
        map((record) => cloneDeep(record))
      ])(this.records);

      resolve(records);
    });
  }

  get(id) {
    return new Promise((resolve, reject) => {
      const record = this.records[id];
      if (record) {
        resolve(cloneDeep(record));
      } else {
        reject(new Error(`Record not found with id: ${id}`));
      }
    });
  }

  create(id) {
    return new Promise((resolve, reject) => {
      if (this.records[id]) {
        reject(new Error(`Record already exist with id: ${id}`));
      } else {
        this.records[id] = {
          ...reduce((result, {name, defaultValue}) => ({
            ...result,
            [name]: isFunction(defaultValue) ? defaultValue(result) : defaultValue
          }), {})(this.attributes),
          id
        };
        resolve(cloneDeep(this.records[id]));
      }
    });
  }

  update(id, payload) {
    return new Promise((resolve, reject) => {
      const record = this.records[id];

      if (!record) {
        reject(new Error(`Record not found with id: ${id}`));
      }

      const update = reduce((result, attributeName) => (
        isUndefined(payload[attributeName])
          ? result
          : {...result, [attributeName]: payload[attributeName]}
      ), {})(this.attributeNames);

      if (!isEmpty(update)) {
        this.records[id] = {...record, ...update, id};
      }

      resolve(cloneDeep(this.records[id]));
    });
  }

  remove(id) {
    return new Promise((resolve, reject) => {
      const record = this.records[id];
      if (!record) {
        reject(new Error(`Record not found with id: ${id}`));
      } else {
        delete this.records[id];
        resolve(cloneDeep(record));
      }
    });
  }
}

const emptyCollections = reduce((result, {name, attributes}) => ({
  ...result,
  [name]: new InternalDBCollectionService({attributes})
}), {});

class InternalDBService {
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

  getOptions() {
    return {
      engine: "internaldb",
      storageAttributes: this.records
    };
  }

  connect() {
    return Promise.resolve();
  }

  get(name) {
    return new Promise((resolve, reject) => {
      if (!this.collections[name]) {
        const attributes = find({name})(this.records);
        if (attributes) {
          this.collections[name] = new InternalDBCollectionService({attributes});
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

export default InternalDBService;
