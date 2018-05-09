import process from 'process';
import { resolve } from 'path';

/**
 * Object that represents available provider options.
 * @typedef {{
 *  config?: string,
 *  kbnServer?: Object
 * }} EnvOptions
 */

export class Env {
  /**
   * @type {string}
   */
  configDir;

  /**
   * @type {string}
   */
  corePluginsDir;

  /**
   * @type {string}
   */
  binDir;

  /**
   * @type {string}
   */
  logDir;

  /**
   * @type {string}
   */
  staticFilesDir;

  /**
   * @type {EnvOptions}
   * @private
   */
  _options;

  /**
   * @param {EnvOptions} options Environment options
   */
  static createDefault(options) {
    return new Env(process.cwd(), options);
  }

  constructor(homeDir, options) {
    this.homeDir = homeDir;
    this._options = options;
    this.configDir = resolve(this.homeDir, 'config');
    this.corePluginsDir = resolve(this.homeDir, 'core_plugins');
    this.binDir = resolve(this.homeDir, 'bin');
    this.logDir = resolve(this.homeDir, 'log');
    this.staticFilesDir = resolve(this.homeDir, 'ui');
  }

  getConfigFile() {
    const defaultConfigFile = this._getDefaultConfigFile();
    return this._options.config === undefined
      ? defaultConfigFile
      : this._options.config;
  }

  getLegacyKbnServer() {
    return this._options.kbnServer;
  }

  /**
   * @returns {string}
   * @private
   */
  _getDefaultConfigFile() {
    return resolve(this.configDir, 'kibana.yml');
  }
}
