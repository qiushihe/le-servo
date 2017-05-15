export const isValid = (value = "") => {
  const nonceValue = `${value}`.trim();

  if (nonceValue.length <= 0) {
    return false;
  }

  return !nonceValue.match(/[^A-Za-z0-9\-_]/g);
};
