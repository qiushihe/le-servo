import Promise from "bluebird";
import assign from "lodash/fp/assign";
import map from "lodash/fp/map";
import reduce from "lodash/fp/reduce";
import find from "lodash/fp/find";
import isUndefined from "lodash/fp/isUndefined";
import isEmpty from "lodash/fp/isEmpty";
import isFunction from "lodash/fp/isFunction";
import cloneDeep from "lodash/fp/cloneDeep";

class RecordService {
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

  get(key) {
    return new Promise((resolve, reject) => {
      const record = this.records[key];
      if (record) {
        resolve(cloneDeep(record));
      } else {
        reject(new Error(`Record not found with key: ${key}`));
      }
    });
  }

  create(key) {
    return new Promise((resolve, reject) => {
      if (this.records[key]) {
        reject(new Error(`Record already exist with key: ${key}`));
      } else {
        this.records[key] = reduce((result, {name, defaultValue}) => ({
          ...result,
          [name]: isFunction(defaultValue) ? defaultValue(result) : defaultValue
        }), {})(this.attributes);
        resolve(cloneDeep(this.records[key]));
      }
    });
  }

  update(key, payload) {
    return new Promise((resolve, reject) => {
      const record = this.records[key];

      if (!record) {
        reject(new Error(`Record not found with key: ${key}`));
      }

      const update = reduce((result, attributeName) => (
        isUndefined(payload[attributeName])
          ? result
          : {...result, [attributeName]: payload[attributeName]}
      ), {})(this.attributeNames);

      if (!isEmpty(update)) {
        this.records[key] = {...record, ...update};
      }

      resolve(cloneDeep(this.records[key]));
    });
  }

  remove(key) {
    return new Promise((resolve, reject) => {
      const record = this.records[key];
      if (!record) {
        reject(new Error(`Record not found with key: ${key}`));
      } else {
        delete this.records[key];
        resolve(cloneDeep(record));
      }
    });
  }
}

export default AccountService;
