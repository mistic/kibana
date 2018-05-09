import { reduce } from './reduce';

function concat(source) {
  return reduce((acc, item) => acc.concat([item]), [])(source);
}

/**
 * Modify a stream to produce a single array containing all of the items emitted
 * by source.
 */
export function toArray() {
  return function toArrayOperation(source) {
    return concat(source);
  };
}
