/**
 * Service that is responsible for maintaining the log config subscription and
 * pushing updates the the logger factory.
 */
export class LoggingService {
  /**
   * @type {?Subscription}
   * @private
   */
  _subscription;

  /**
   * @type {MutableLoggerFactory}
   * @readonly
   * @private
   */
  _loggingFactory;

  constructor(loggingFactory) {
    this._loggingFactory = loggingFactory;
  }

  /**
   * Takes `LoggingConfig` observable and pushes all config updates to the
   * internal logger factory.
   * @param {Observable<LoggingConfig>} config$ Observable that tracks all updates in the logging config.
   */
  upgrade(config$) {
    this._subscription = config$.subscribe({
      next: config => this._loggingFactory.updateConfig(config),
    });
  }

  /**
   * Asynchronous method that causes service to unsubscribe from logging config updates
   * and close internal logger factory.
   */
  async stop() {
    if (this._subscription !== undefined) {
      this._subscription.unsubscribe();
    }
    await this._loggingFactory.close();
  }
}
