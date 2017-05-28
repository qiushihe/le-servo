import {GetDirectoryService} from "services/default.services";

export default (_, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(GetDirectoryService().toJSON())).end();
};
