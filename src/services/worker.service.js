import Promise from "bluebird";
import WorkerFarm from "worker-farm";
import isEmpty from "lodash/fp/isEmpty";
import defer from "lodash/fp/defer";
import {convert as convertReduce} from "lodash/fp/reduce";

const reduce = convertReduce({cap: false});

class WorkerService {
  constructor(options = {}) {
    if (!options.storage) {
      throw new Error("Missing storage service");
    }

    if (isEmpty(options.workers)) {
      throw new Error("Missing workers");
    }

    if (isEmpty(options.workerOptions)) {
      throw new Error("Missing worker options");
    }

    this.storage = options.storage;
    this.workerOptions = options.workerOptions;
    this.hasExternalAccess = this.storage.getOptions().engine === "mongodb";

    this.workerFarms = reduce((result, path, name) => {
      if (this.hasExternalAccess) {
        return {...result, [name]: WorkerFarm(path)};
      } else {
        return {...result, [name]: (...restArgs) => {
          return defer(require(path), ...restArgs);
        }};
      }
    }, {})(options.workers);
  }

  start(name, options) {
    const {
      storage,
      storageOptions,
      ...restWorkerOptions
    } = this.workerOptions;

    return new Promise((resolve, reject) => {
      this.workerFarms[name]({
        ...(this.hasExternalAccess ? {storageOptions} : {storage}),
        ...restWorkerOptions,
        ...options
      }, (err, output) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log(output);
          resolve(output);
        }
      });
    });
  }
}

export default WorkerService;
