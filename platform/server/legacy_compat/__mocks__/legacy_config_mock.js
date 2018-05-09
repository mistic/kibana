/**
 * This is a partial mock of core/server/config/config.js.
 */
export class LegacyConfigMock {
  constructor(rawData = new Map()) {
    this.__rawData = rawData;
  }

  set = jest.fn((key, value) => {
    // Real legacy config throws error if key is not presented in the schema.
    if (!this.__rawData.has(key)) {
      throw new TypeError(`Unknown schema key: ${key}`);
    }

    this.__rawData.set(key, value);
  });

  get = jest.fn(key => {
    // Real legacy config throws error if key is not presented in the schema.
    if (!this.__rawData.has(key)) {
      throw new TypeError(`Unknown schema key: ${key}`);
    }

    return this.__rawData.get(key);
  });

  has = jest.fn(key => this.__rawData.has(key));
}
