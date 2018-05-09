/**
 * Represents a wrapper around legacy `kbnServer` instance that exposes only
 * a subset of `kbnServer` APIs used by the new platform.
 */
export class LegacyKbnServer {
  constructor(rawKbnServer) {
    this._rawKbnServer = rawKbnServer;
  }

  /**
   * Custom HTTP Listener used by HapiJS server in the legacy platform.
   */
  get newPlatformProxyListener() {
    return this._rawKbnServer.newPlatform.proxyListener;
  }

  /**
   * Forwards log request to the legacy platform.
   * @param {string|string[]} tags A string or array of strings used to briefly identify the event.
   * @param {string | Error} [data] Optional string or object to log with the event.
   * @param {Date} [timestamp] Timestamp value associated with the log record.
   */
  log(tags, data, timestamp) {
    this._rawKbnServer.server.log(tags, data, timestamp);
  }
}
