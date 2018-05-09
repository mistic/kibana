import {
  k$,
  BehaviorSubject,
  map,
  filter,
  skipRepeats,
} from '../../lib/kbn_observable';
import { isEqual, isPlainObject } from 'lodash';

import { getConfigFromFile } from './read_config';
import { ObjectToRawConfigAdapter } from './object_to_raw_config_adapter';

/**
 * Represents raw config store.
 *
 * @interface RawConfig
 */

/**
 * Returns whether or not there is a config value located at the specified path.
 *
 * @function
 * @name RawConfig#has
 * @param {string|string[]} configPath Path to locate value at.
 * @returns {boolean} Whether or not a value exists at the path.
 */

/**
 * Returns config value located at the specified path.
 *
 * @function
 * @name RawConfig#get
 * @param {string|string[]} configPath Path to locate value at.
 * @returns {*} Config value.
 */

/**
 * Sets config value at the specified path.
 *
 * @function
 * @name RawConfig#set
 * @param {string|string[]} configPath Path to locate value at.
 * @param {*} value Value to set for the specified path.
 */

/**
 * Returns full flattened list of the config paths that config contains.
 *
 * @function
 * @name RawConfig#getFlattenedPaths
 * @returns {string[]} List of the string config paths.
 */

// Used to indicate that no config has been received yet
const notRead = Symbol('config not yet read');

export class RawConfigService {
  /**
   * The stream of configs read from the config file. Will be the symbol
   * `notRead` before the config is initially read, and after that it can
   * potentially be `null` for an empty yaml file.
   *
   * This is the _raw_ config before any overrides are applied.
   *
   * As we have a notion of a _current_ config we rely on a BehaviorSubject so
   * every new subscription will immediately receive the current config.
   * @type {BehaviorSubject<*>}
   * @private
   * @readonly
   */
  _rawConfigFromFile$ = new BehaviorSubject(notRead);

  /**
   * @type {Observable<RawConfig>}
   * @private
   * @readonly
   */
  _config$;

  constructor(configFile) {
    this._configFile = configFile;

    this._config$ = k$(this._rawConfigFromFile$)(
      filter(rawConfig => rawConfig !== notRead),
      map(rawConfig => {
        // If the raw config is null, e.g. if empty config file, we default to
        // an empty config
        if (rawConfig == null) {
          return new ObjectToRawConfigAdapter({});
        }

        if (isPlainObject(rawConfig)) {
          // TODO Make config consistent, e.g. handle dots in keys
          return new ObjectToRawConfigAdapter(rawConfig);
        }

        throw new Error(
          `the raw config must be an object, got [${typeof rawConfig}]`
        );
      }),
      // We only want to update the config if there are changes to it
      skipRepeats(isEqual)
    );
  }

  /**
   * Read the initial Kibana config.
   */
  loadConfig() {
    const config = getConfigFromFile(this._configFile);
    this._rawConfigFromFile$.next(config);
  }

  stop() {
    this._rawConfigFromFile$.complete();
  }

  /**
   * Re-read the Kibana config.
   */
  reloadConfig() {
    this.loadConfig();
  }

  getConfig$() {
    return this._config$;
  }
}
