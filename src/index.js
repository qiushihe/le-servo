import server from "./server";

const port = 3000;

server({
  origin: "http://localhost:3000",
  nonceBufferSize: 32
}).listen(port, () => {
  console.log(`Server started on port ${port}`); // eslint-disable-line
});
