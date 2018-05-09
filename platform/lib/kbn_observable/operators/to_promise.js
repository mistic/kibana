export function toPromise() {
  return function toPromiseOperation(source) {
    return new Promise((resolve, reject) => {
      let lastValue;

      source.subscribe({
        next(value) {
          lastValue = value;
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve(lastValue);
        },
      });
    });
  };
}
