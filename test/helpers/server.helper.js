export const getRansomPort = () => {
  return Math.floor(Math.random() * (9000 - 7000 + 1)) + 7000;
};
