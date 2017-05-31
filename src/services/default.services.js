import NonceService from "services/nonce.service";
import JoseService from "services/jose.service";
import DirectoryService from "services/directory.service";
import CollectionService from "services/collection.service";

const Instances = {};

export const Config = {
  NonceService: [{bufferSize: 32}],
  JoseService: [],
  DirectoryService: [{origin: "http://localhost:3000"}],
  CollectionService: [{
    records: [{
      name: "account",
      attributes: [
        {name: "status", defaultValue: "valid"},
        {name: "contact", defaultValue: []},
        {name: "termsOfServiceAgreed", defaultValue: false}
      ]
    }]
  }]
};

export const GetNonceService = () => {
  if (!Instances.NonceService) {
    Instances.NonceService = new NonceService(...(Config.NonceService || []));
  }
  return Instances.NonceService;
};

export const GetJoseService = () => {
  if (!Instances.JoseService) {
    Instances.JoseService = new JoseService(...(Config.JoseService || []));
  }
  return Instances.JoseService;
};

export const GetDirectoryService = () => {
  if (!Instances.DirectoryService) {
    Instances.DirectoryService = new DirectoryService(...(Config.DirectoryService || []));
  }
  return Instances.DirectoryService;
};

export const GetCollectionService = () => {
  if (!Instances.CollectionService) {
    Instances.CollectionService = new CollectionService(...(Config.CollectionService || []));
  }
  return Instances.CollectionService;
};
