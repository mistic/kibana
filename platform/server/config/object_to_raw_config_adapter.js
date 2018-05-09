import { has, get, set } from 'lodash';

/**
 * Allows plain javascript object to behave like `RawConfig` instance.
 */
export class ObjectToRawConfigAdapter {
  constructor(rawValue) {
    this._rawValue = rawValue;
  }

  has(configPath) {
    return has(this._rawValue, configPath);
  }

  get(configPath) {
    return get(this._rawValue, configPath);
  }

  set(configPath, value) {
    set(this._rawValue, configPath, value);
  }

  getFlattenedPaths() {
    return [...flattenObjectKeys(this._rawValue)];
  }
}

function* flattenObjectKeys(obj, path = '') {
  if (typeof obj !== 'object' || obj === null) {
    yield path;
  } else {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path !== '' ? `${path}.${key}` : key;
      yield* flattenObjectKeys(value, newPath);
    }
  }
}
