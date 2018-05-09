import { LoggingConfig } from './logging_config';
import { LogLevel } from './log_level';
import { BaseLogger } from './logger';
import { LoggerAdapter } from './logger_adapter';
import { Appenders } from './appenders/appenders';
import { BufferAppender } from './appenders/buffer/buffer_appender';

/**
 * The single purpose of `LoggerFactory` interface is to define a way to
 * retrieve a context-based logger instance.
 *
 * @interface LoggerFactory
 */

/**
 * Returns a `Logger` instance for the specified context.
 *
 * @function
 * @name LoggerFactory#get
 * @param {...string} contextParts Parts of the context to return logger for. For example
 * get('plugins', 'pid') will return a logger for the `plugins.pid` context.
 * @returns {Logger}
 */

/**
 * @implements LoggerFactory
 */
export class MutableLoggerFactory {
  /**
   * @type {LoggingConfig}
   * @private
   */
  _config;

  /**
   * @type {Map<string, Appender>}
   * @readonly
   * @private
   */
  _appenders = new Map();

  /**
   * @type {BufferAppender}
   * @readonly
   * @private
   */
  _bufferAppender = new BufferAppender();

  /**
   * @type {Map<string, LoggerAdapter>}
   * @readonly
   * @private
   */
  _loggers = new Map();

  /**
   * @type {Env}
   * @readonly
   * @private
   */
  _env;

  constructor(env) {
    this._env = env;
  }

  get(...contextParts) {
    const context = LoggingConfig.getLoggerContext(contextParts);
    if (this._loggers.has(context)) {
      return this._loggers.get(context);
    }

    this._loggers.set(
      context,
      new LoggerAdapter(this._createLogger(context, this._config))
    );

    return this._loggers.get(context);
  }

  /**
   * Updates all current active loggers with the new config values.
   * @param {LoggingConfig} config New config instance.
   */
  updateConfig(config) {
    // Config update is asynchronous and may require some time to complete, so we should invalidate
    // config so that new loggers will be using BufferAppender until newly configured appenders are ready.
    this._config = undefined;

    // Appenders must be reset, so we first dispose of the current ones, then
    // build up a new set of appenders.

    for (const appender of this._appenders.values()) {
      appender.dispose();
    }
    this._appenders.clear();

    for (const [appenderKey, appenderConfig] of config.appenders.entries()) {
      this._appenders.set(
        appenderKey,
        Appenders.create(appenderConfig, this._env)
      );
    }

    for (const [loggerKey, loggerAdapter] of this._loggers.entries()) {
      loggerAdapter.updateLogger(this._createLogger(loggerKey, config));
    }

    this._config = config;

    // Re-log all buffered log records with newly configured appenders.
    for (const logRecord of this._bufferAppender.flush()) {
      this.get(logRecord.context).log(logRecord);
    }
  }

  /**
   * Disposes all loggers (closes log files, clears buffers etc.). Factory is not usable after
   * calling of this method.
   * @returns Promise that is resolved once all loggers are successfully disposed.
   */
  async close() {
    for (const appender of this._appenders.values()) {
      await appender.dispose();
    }

    await this._bufferAppender.dispose();

    this._appenders.clear();
    this._loggers.clear();
  }

  /**
   * @param {string} context
   * @param {LoggingConfig} [config]
   * @returns {BaseLogger}
   * @private
   */
  _createLogger(context, config) {
    if (config === undefined) {
      // If we don't have config yet, use `buffered` appender that will store all logged messages in the memory
      // until the config is ready.
      return new BaseLogger(context, LogLevel.All, [this._bufferAppender]);
    }

    const { level, appenders } = this._getLoggerConfigByContext(
      config,
      context
    );
    const loggerLevel = LogLevel.fromId(level);
    const loggerAppenders = appenders.map(appenderKey =>
      this._appenders.get(appenderKey)
    );

    return new BaseLogger(context, loggerLevel, loggerAppenders);
  }

  /**
   * @param {LoggingConfig} config
   * @param {string} context
   * @returns {LoggerConfigType}
   * @private
   */
  _getLoggerConfigByContext(config, context) {
    const loggerConfig = config.loggers.get(context);
    if (loggerConfig !== undefined) {
      return loggerConfig;
    }

    // If we don't have configuration for the specified context and it's the "nested" one (eg. `foo.bar.baz`),
    // let's move up to the parent context (eg. `foo.bar`) and check if it has config we can rely on. Otherwise
    // we fallback to the `root` context that should always be defined (enforced by configuration schema).
    return this._getLoggerConfigByContext(
      config,
      LoggingConfig.getParentLoggerContext(context)
    );
  }
}
