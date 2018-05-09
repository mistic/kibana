import { Server as HapiServer } from 'hapi';
import { readFileSync } from 'fs';

import { modifyUrl } from '../../utils/url';

export class HttpServer {
  /**
   * @type {HapiServer}
   * @private
   */
  _server;

  /**
   * @type {Logger}
   * @readonly
   * @private
   */
  _log;

  /**
   * @type {Env}
   * @readonly
   * @private
   */
  _env;

  /**
   * @type {Set<Router>}
   * @private
   */
  _registeredRouters = new Set();

  constructor(log, env) {
    this._log = log;
    this._env = env;
  }

  isListening() {
    return this._server !== undefined && this._server.listener.listening;
  }

  registerRouter(router) {
    if (this.isListening()) {
      throw new Error(
        'Routers can be registered only when HTTP server is stopped.'
      );
    }

    this._registeredRouters.add(router);
  }

  /**
   * @param {HttpConfig} config
   * @returns {Promise<void>}
   */
  async start(config) {
    this._server = this._initializeServer(config);

    this._setupBasePathRewrite(this._server, config);

    for (const router of this._registeredRouters) {
      for (const route of router.getRoutes()) {
        this._server.route({
          method: route.method,
          path: this._getRouteFullPath(router.path, route.path),
          handler: route.handler,
        });
      }
    }

    const legacyKbnServer = this._env.getLegacyKbnServer();
    if (legacyKbnServer !== undefined) {
      legacyKbnServer.newPlatformProxyListener.bind(this._server.listener);

      // We register Kibana proxy middleware right before we start server to allow
      // all new platform plugins register their routes, so that kbnServer
      // handles only requests that aren't handled by the new platform.
      this._server.route({
        method: '*',
        path: '/{p*}',
        options: {
          payload: {
            output: 'stream',
            parse: false,
            timeout: false,
          },
        },
        handler: ({ raw: { req, res } }, responseToolkit) => {
          legacyKbnServer.newPlatformProxyListener.proxy(req, res);
          return responseToolkit.abandon;
        },
      });
    }

    this._server.listener.on('clientError', (err, socket) => {
      if (socket.writable) {
        socket.end(new Buffer('HTTP/1.1 400 Bad Request\r\n\r\n', 'ascii'));
      } else {
        socket.destroy(err);
      }
    });

    this._log.info(`starting http server [${config.host}:${config.port}]`);

    await this._server.start();
  }

  async stop() {
    this._log.info('stopping http server');

    if (this._server === undefined) {
      return;
    }

    await this._server.stop();
    this._server = undefined;
  }

  /**
   * @param {HttpConfig} config
   * @returns {HapiServer}
   */
  _initializeServer(config) {
    const options = {
      host: config.host,
      port: config.port,
      routes: {
        cors: config.cors,
        payload: {
          maxBytes: config.maxPayload.getValueInBytes(),
        },
        validate: {
          options: {
            abortEarly: false,
          },
        },
      },
      state: {
        strictHeader: false,
      },
    };

    const ssl = config.ssl;
    if (ssl.enabled) {
      options.tls = {
        ca:
          config.ssl.certificateAuthorities &&
          config.ssl.certificateAuthorities.map(caFilePath =>
            readFileSync(caFilePath)
          ),

        key: readFileSync(ssl.key),
        cert: readFileSync(ssl.certificate),
        passphrase: ssl.keyPassphrase,

        ciphers: config.ssl.cipherSuites.join(':'),
        // We use the server's cipher order rather than the client's to prevent the BEAST attack.
        honorCipherOrder: true,
        secureOptions: ssl.getSecureOptions(),
      };
    }

    return new HapiServer(options);
  }

  /**
   * @param {Server} server
   * @param {HttpConfig} config
   * @private
   */
  _setupBasePathRewrite(server, config) {
    if (config.basePath === undefined || !config.rewriteBasePath) {
      return;
    }

    const basePath = config.basePath;
    server.ext('onRequest', (request, responseToolkit) => {
      const newURL = modifyUrl(request.url.href, urlParts => {
        if (
          urlParts.pathname != null &&
          urlParts.pathname.startsWith(basePath)
        ) {
          urlParts.pathname = urlParts.pathname.replace(basePath, '') || '/';
        } else {
          return {};
        }
      });

      if (!newURL) {
        return responseToolkit
          .response('Not Found')
          .code(404)
          .takeover();
      }

      request.setUrl(newURL);
      // We should update raw request as well since it can be proxied to the old platform
      // where base path isn't expected.
      request.raw.req.url = request.url.href;

      return responseToolkit.continue;
    });
  }

  /**
   * @param {string} routerPath
   * @param {string} routePath
   * @returns {string}
   * @private
   */
  _getRouteFullPath(routerPath, routePath) {
    // If router's path ends with slash and route's path starts with slash,
    // we should omit one of them to have a valid concatenated path.
    const routePathStartIndex =
      routerPath.endsWith('/') && routePath.startsWith('/') ? 1 : 0;
    return `${routerPath}${routePath.slice(routePathStartIndex)}`;
  }
}
