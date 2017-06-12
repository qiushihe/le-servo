import flow from "lodash/fp/flow";
import keys from "lodash/fp/keys";
import forEach from "lodash/fp/forEach";
import reduce from "lodash/fp/reduce";

class DirectoryService {
  constructor({origin} = {}) {
    this.origin = origin;
    this.fields = {};
  }

  getFullUrl(path) {
    return `${this.origin}${path}`;
  }

  addField(field, {method, path, handler}) {
    this.fields[field] = {method, path, handler};
  }

  each(iterator) {
    flow([
      keys,
      forEach((key) => {
        const {method, path, handler} = this.fields[key];
        iterator(key, {method, path, handler});
      })
    ])(this.fields);
  }

  toJSON() {
    return flow([
      keys,
      reduce((result, key) => {
        const {path} = this.fields[key];
        return {
          ...result,
          [key]: `${this.origin}${path}`
        };
      }, {})
    ])(this.fields);
  }
}

export default DirectoryService;
