import { Observable } from '../observable';

/**
 * Alias for `Observable.of`
 */
export function $of(...items) {
  return Observable.of(...items);
}
