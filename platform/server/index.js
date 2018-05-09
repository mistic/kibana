import { HttpModule, HttpConfig, Router } from './http';

export class Server {
  /**
   * @type {HttpModule}
   * @readonly
   * @private
   */
  _http;

  /**
   * @type {Logger}
   * @readonly
   * @private
   */
  _log;

  /**
   * @type {ConfigService}
   * @readonly
   * @private
   */
  _configService;

  constructor(configService, logger, env) {
    this._configService = configService;

    this._log = logger.get('server');

    const httpConfig$ = configService.atPath('server', HttpConfig);
    this._http = new HttpModule(httpConfig$, logger, env);
  }

  async start() {
    this._log.info('starting server :tada:');

    await this._startHTTPService();

    const unhandledConfigPaths = await this._configService.getUnusedPaths();
    if (unhandledConfigPaths.length > 0) {
      throw new Error(
        `some config paths are not handled: ${JSON.stringify(
          unhandledConfigPaths
        )}`
      );
    }
  }

  async stop() {
    this._log.debug('stopping server');

    await this._http.service.stop();
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  _startHTTPService() {
    const router = new Router('/core');
    router.get(
      {
        path: '/',
        validate: false,
      },
      async (req, res) => res.ok({ version: '0.0.1' })
    );

    this._http.service.registerRouter(router);

    return this._http.service.start();
  }
}
