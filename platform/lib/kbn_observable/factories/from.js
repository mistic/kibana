import { Observable } from '../observable';

/**
 * Alias for `Observable.from`
 *
 * If you need to handle:
 *
 * - promises, use `$fromPromise`
 * - functions, use `$fromCallback`
 */
export function $from(x) {
  return Observable.from(x);
}
