import { Observable } from '../observable';

/**
 * Creates an observable that combines all observables passed as arguments into
 * a single output observable by subscribing to them in series, i.e. it will
 * subscribe to the next observable when the previous completes.
 *
 * @param {...Observable}
 * @return {Observable}
 */
export function $concat(...observables) {
  return new Observable(observer => {
    let subscription;

    function subscribe(i) {
      if (observer.closed) {
        return;
      }

      if (i >= observables.length) {
        observer.complete();
      }

      subscription = observables[i].subscribe({
        next(value) {
          observer.next(value);
        },
        error(error) {
          observer.error(error);
        },
        complete() {
          subscribe(i + 1);
        },
      });
    }

    subscribe(0);

    return function() {
      if (subscription !== undefined) {
        subscription.unsubscribe();
      }
    };
  });
}
