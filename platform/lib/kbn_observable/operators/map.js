import { Observable } from '../observable';

/**
 * Modifies each value from the source by passing it to `fn(item, i)` and
 * emitting the return value of that function instead.
 *
 * @param fn The function to apply to each `value` emitted by the source
 * Observable. The `index` parameter is the number `i` for the i-th emission
 * that has happened since the subscription, starting from the number `0`.
 * @return An Observable that emits the values from the source Observable
 * transformed by the given `fn` function.
 */
export function map(fn) {
  return function mapOperation(source) {
    return new Observable(observer => {
      let i = 0;

      return source.subscribe({
        next(value) {
          let result;
          try {
            result = fn(value, i++);
          } catch (e) {
            observer.error(e);
            return;
          }
          observer.next(result);
        },
        error(error) {
          observer.error(error);
        },
        complete() {
          observer.complete();
        },
      });
    });
  };
}
