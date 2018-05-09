export function pipe(...fns) {
  return pipeFromArray(fns);
}

const noop = () => {};

/* @internal */
export function pipeFromArray(fns) {
  if (fns.length === 0) {
    return noop;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return function piped(input) {
    return fns.reduce((prev, fn) => fn(prev), input);
  };
}
