export default ({directoryService}) => (_, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(directoryService.toJSON())).end();
};
