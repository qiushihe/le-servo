import Promise from "bluebird";
import assign from "lodash/fp/assign";
import map from "lodash/fp/map";
import reduce from "lodash/fp/reduce";
import flow from "lodash/fp/flow";
import values from "lodash/fp/values";
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

export default RecordService;
