import { Observable } from '../observable';
import { $from } from '../factories';

const pending = Symbol('awaiting first value');

/**
 * Creates an observable that combines the values by subscribing to all
 * observables passed and emitting an array with the latest value from each
 * observable once after each observable has emitted at least once, and again
 * any time an observable emits after that.
 *
 * @param {...Observable}
 * @return {Observable}
 */
export function $combineLatest(...observables) {
  return new Observable(observer => {
    // create an array that will receive values as observables
    // update and initialize it with `pending` symbols so that
    // we know when observables emit for the first time
    const values = observables.map(() => pending);

    let needFirstCount = values.length;
    let activeCount = values.length;

    const subs = observables.map((observable, i) =>
      $from(observable).subscribe({
        next(value) {
          if (values[i] === pending) {
            needFirstCount--;
          }

          values[i] = value;

          if (needFirstCount === 0) {
            observer.next(values.slice());
          }
        },

        error(error) {
          observer.error(error);
          values.length = 0;
        },

        complete() {
          activeCount--;

          if (activeCount === 0) {
            observer.complete();
            values.length = 0;
          }
        },
      })
    );

    return function() {
      subs.forEach(sub => {
        sub.unsubscribe();
      });
      values.length = 0;
    };
  });
}
