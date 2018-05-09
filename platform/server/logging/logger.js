import { LogLevel } from './log_level';

function isError(x) {
  return x instanceof Error;
}

/**
 * Essential parts of every log message.
 * @typedef {{
 *  timestamp: Date,
 *  level: LogLevel,
 *  context: string,
 *  message: string,
 *  error?: Error,
 *  meta?: Object
 * }} LogRecord
 */

/**
 * Logger exposes all the necessary methods to log any type of information and
 * this is the interface used by the logging consumers including plugins.
 *
 * @interface Logger
 */

/**
 * @function
 * @name Logger#trace
 * @param {string} message
 * @param {Object} [meta]
 */

/**
 * @function
 * @name Logger#debug
 * @param {string} message
 * @param {Object} [meta]
 */

/**
 * @function
 * @name Logger#info
 * @param {string} message
 * @param {Object} [meta]
 */

/**
 * @function
 * @name Logger#warn
 * @param {string|Error} errorOrMessage
 * @param {Object} [meta]
 */

/**
 * @function
 * @name Logger#error
 * @param {string|Error} errorOrMessage
 * @param {Object} [meta]
 */

/**
 * @function
 * @name Logger#fatal
 * @param {string|Error} errorOrMessage
 * @param {Object} [meta]
 */

/**
 * @function
 * @name Logger#log
 * @param {LogRecord} record
 * @internal
 */

/**
 * @implements Logger
 */
export class BaseLogger {
  /**
   * @param {string} context
   * @param {LogLevel} level
   * @param {Appender[]} appenders
   */
  constructor(context, level, appenders) {
    this._context = context;
    this._level = level;
    this._appenders = appenders;
  }

  trace(message, meta) {
    this.log(this._createLogRecord(LogLevel.Trace, message, meta));
  }

  debug(message, meta) {
    this.log(this._createLogRecord(LogLevel.Debug, message, meta));
  }

  info(message, meta) {
    this.log(this._createLogRecord(LogLevel.Info, message, meta));
  }

  warn(errorOrMessage, meta) {
    this.log(this._createLogRecord(LogLevel.Warn, errorOrMessage, meta));
  }

  error(errorOrMessage, meta) {
    this.log(this._createLogRecord(LogLevel.Error, errorOrMessage, meta));
  }

  fatal(errorOrMessage, meta) {
    this.log(this._createLogRecord(LogLevel.Fatal, errorOrMessage, meta));
  }

  log(record) {
    if (!this._level.supports(record.level)) {
      return;
    }

    for (const appender of this._appenders) {
      appender.append(record);
    }
  }

  /**
   * @param {LogLevel} level
   * @param {string|Error} errorOrMessage
   * @param {Object} meta
   * @returns {LogRecord}
   * @private
   */
  _createLogRecord(level, errorOrMessage, meta) {
    if (isError(errorOrMessage)) {
      return {
        timestamp: new Date(),
        level,
        context: this._context,
        meta,
        message: errorOrMessage.message,
        error: errorOrMessage,
      };
    }

    return {
      timestamp: new Date(),
      level,
      context: this._context,
      meta,
      message: errorOrMessage,
    };
  }
}
