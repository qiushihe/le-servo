import Promise from "bluebird";

export const async = (test) => (done) => {
  Promise.resolve().then(test).then(done).catch(done);
};
