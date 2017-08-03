import Promise from "bluebird";

const directoryHandler = ({
  directoryService
}) => {
  return Promise.resolve({
    contentType: "application/json",
    body: directoryService.toJSON()
  });
};

export default directoryHandler;
