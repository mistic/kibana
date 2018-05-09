export function pick(obj, keys) {
  return keys.reduce((acc, val) => {
    acc[val] = obj[val];
    return acc;
  }, {});
}
