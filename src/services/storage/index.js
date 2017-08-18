import MongoDBService from "./mongodb.service";
import InternalDBService from "./internaldb.service";

export default ({
  engine,
  connectionUrl,
  storageAttributes
}) => {
  return engine === "mongodb"
    ? new MongoDBService({connectionUrl, collectionOptions: storageAttributes})
    : new InternalDBService({records: storageAttributes});
};
