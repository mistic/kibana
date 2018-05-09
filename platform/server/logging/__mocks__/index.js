// Test helpers to simplify mocking logs and collecting all their outputs

export const logger = {
  get() {
    return this._log;
  },

  _log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    log: jest.fn(),
  },

  _collect() {
    return {
      debug: this._log.debug.mock.calls,
      info: this._log.info.mock.calls,
      warn: this._log.warn.mock.calls,
      error: this._log.error.mock.calls,
      trace: this._log.trace.mock.calls,
      fatal: this._log.fatal.mock.calls,
      log: this._log.log.mock.calls,
    };
  },

  _clear() {
    this._log.debug.mockClear();
    this._log.info.mockClear();
    this._log.warn.mockClear();
    this._log.error.mockClear();
    this._log.trace.mockClear();
    this._log.fatal.mockClear();
    this._log.log.mockClear();
  },
};
