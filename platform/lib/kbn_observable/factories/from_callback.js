import { Observable } from '../observable';
import { isObservable } from '../lib/is_observable';

/**
 * Creates an observable that calls the specified function with no arguments
 * when it is subscribed. The observable will behave differently based on the
 * return value of the factory:
 *
 * - return `undefined`: observable will immediately complete
 * - returns observable: observable will mirror the returned value
 * - otherwise: observable will emit the value and then complete
 *
 * @param {Function}
 * @returns {Observable}
 */
export function $fromCallback(factory) {
  return new Observable(observer => {
    const result = factory();

    if (result === undefined) {
      observer.complete();
    } else if (isObservable(result)) {
      return result.subscribe(observer);
    } else {
      observer.next(result);
      observer.complete();
    }
  });
}
