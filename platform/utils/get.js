/**
 * Retrieve the value for the specified path
 *
 * Note that dot is _not_ allowed to specify a deeper key, it will assume that
 * the dot is part of the key itself.
 */
export function get(obj, path) {
  if (typeof path === 'string') {
    if (path.includes('.')) {
      throw new Error(
        'Using dots in `get` with a string is not allowed, use array instead'
      );
    }

    return obj[path];
  }

  for (const key of path) {
    obj = obj[key];
  }

  return obj;
}
