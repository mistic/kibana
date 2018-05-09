/**
 * Test helper that collects all actions, and returns an array with all
 * `next`-ed values, plus any `error` received or a `C` if `complete` is
 * triggered.
 */
export function collect(source) {
  return new Promise(resolve => {
    const values = [];

    source.subscribe({
      next(x) {
        values.push(x);
      },
      error(err) {
        values.push(err);
        resolve(values);
      },
      complete() {
        values.push('C');
        resolve(values);
      },
    });
  });
}
