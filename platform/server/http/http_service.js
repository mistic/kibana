import { k$, first, toPromise } from '../../lib/kbn_observable';
import { HttpServer } from './http_server';

export class HttpService {
  /**
   * @type {HttpServer}
   * @readonly
   * @private
   */
  _httpServer;

  /**
   * @type {Observable<HttpConfig>}
   * @readonly
   * @private
   */
  _config$;

  /**
   * @type {?Subscription}
   * @private
   */
  _configSubscription;

  /**
   * @type {Logger}
   * @readonly
   * @private
   */
  _log;

  constructor(config$, logger, env) {
    this._config$ = config$;
    this._log = logger.get('http');
    this._httpServer = new HttpServer(logger.get('http', 'server'), env);
  }

  async start() {
    this._configSubscription = this._config$.subscribe(() => {
      if (this._httpServer.isListening()) {
        // If the server is already running we can't make any config changes
        // to it, so we warn and don't allow the config to pass through.
        this._log.warn(
          'Received new HTTP config after server was started. ' +
            'Config will **not** be applied.'
        );
      }
    });

    const config = await k$(this._config$)(first(), toPromise());
    await this._httpServer.start(config);
  }

  async stop() {
    if (this._configSubscription === undefined) {
      return;
    }

    this._configSubscription.unsubscribe();
    this._configSubscription = undefined;

    await this._httpServer.stop();
  }

  registerRouter(router) {
    if (this._httpServer.isListening()) {
      // If the server is already running we can't make any config changes
      // to it, so we warn and don't allow the config to pass through.
      // TODO Should we throw instead?
      this._log.error(
        `Received new router [${router.path}] after server was started. ` +
          'Router will **not** be applied.'
      );
    } else {
      this._log.info(`registering route handler for [${router.path}]`);
      this._httpServer.registerRouter(router);
    }
  }
}
