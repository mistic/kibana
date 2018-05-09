export function isObservable(x) {
  return (
    x !== null && typeof x === 'object' && x[Symbol.observable] !== undefined
  );
}
