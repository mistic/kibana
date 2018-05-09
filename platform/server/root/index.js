import { ConfigService } from '../config';
import { Server } from '..';
import { LoggingService } from '../logging/logging_service';
import { MutableLoggerFactory } from '../logging/logger_factory';
import { LoggingConfig } from '../logging/logging_config';

/**
 * Top-level entry point to kick off the app and start the Kibana server.
 */
export class Root {
  /**
   * @type {ConfigService}
   */
  configService;

  /**
   * @type {?Server}
   */
  server;

  /**
   * @type {Logger}
   * @readonly
   */
  log;

  /**
   * @type {LoggerFactory}
   * @readonly
   */
  logger;

  /**
   * @type {LoggingService}
   * @readonly
   * @private
   */
  _loggingService;

  /**
   * @type {Env}
   * @readonly
   * @private
   */
  _env;

  /**
   * @type {function}
   * @readonly
   * @private
   */
  _onShutdown;

  /**
   *
   * @param {Observable<RawConfig>} rawConfig$
   * @param {Env} env
   * @param {function} onShutdown
   */
  constructor(rawConfig$, env, onShutdown = () => {}) {
    this._env = env;
    this._onShutdown = onShutdown;

    const loggerFactory = new MutableLoggerFactory(env);
    this._loggingService = new LoggingService(loggerFactory);
    this.logger = loggerFactory;

    this.log = this.logger.get('root');
    this.configService = new ConfigService(rawConfig$, env, this.logger);
  }

  async start() {
    try {
      const loggingConfig$ = this.configService.atPath(
        'logging',
        LoggingConfig
      );
      this._loggingService.upgrade(loggingConfig$);
    } catch (e) {
      // This specifically console.logs because we were not able to configure
      // the logger.
      console.error('Configuring logger failed:', e.message);

      await this.shutdown(e);
      throw e;
    }

    this.log.info('starting the server');

    this.server = new Server(this.configService, this.logger, this._env);

    try {
      await this.server.start();
    } catch (e) {
      this.log.error(e);

      await this.shutdown(e);
      throw e;
    }
  }

  /**
   * @param {?Error} reason
   * @returns {Promise<void>}
   */
  async shutdown(reason) {
    this.log.info('stopping Kibana');
    if (this.server !== undefined) {
      await this.server.stop();
    }

    await this._loggingService.stop();

    this._onShutdown(reason);
  }
}
