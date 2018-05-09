/**
 * @implements Logger
 */
export class LoggerAdapter {
  /**
   * @type {Logger}
   * @private
   */
  _logger;

  constructor(logger) {
    this._logger = logger;
  }

  /**
   * The current logger can be updated "on the fly", e.g. when the log config
   * has changed.
   *
   * This is not intended for external use, only internally in Kibana
   * @param {Logger} logger
   */
  updateLogger(logger) {
    this._logger = logger;
  }

  trace(message, meta) {
    this._logger.trace(message, meta);
  }

  debug(message, meta) {
    this._logger.debug(message, meta);
  }

  info(message, meta) {
    this._logger.info(message, meta);
  }

  warn(errorOrMessage, meta) {
    this._logger.warn(errorOrMessage, meta);
  }

  error(errorOrMessage, meta) {
    this._logger.error(errorOrMessage, meta);
  }

  fatal(errorOrMessage, meta) {
    this._logger.fatal(errorOrMessage, meta);
  }

  log(record) {
    this._logger.log(record);
  }
}
