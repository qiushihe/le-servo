import Promise from "bluebird";

const emptyHandler = () => {
  return Promise.resolve({
    status: 204
  });
};

export default emptyHandler;
