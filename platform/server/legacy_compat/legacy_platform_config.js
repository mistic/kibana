import { NEW_PLATFORM_CONFIG_ROOT, ObjectToRawConfigAdapter } from '../config';

/**
 * Represents legacy Kibana config class.
 *
 * @interface LegacyConfig
 */

/**
 * @function
 * @name LegacyConfig#get
 * @param {string} configPath
 * @returns {*}
 */

/**
 * @function
 * @name LegacyConfig#set
 * @param {string} configPath
 * @param {*} configValue
 */

/**
 * @function
 * @name LegacyConfig#has
 * @param {string} configPath
 * @returns {boolean}
 */

/**
 * Represents logging config supported by the legacy platform.
 * @typedef {{
 *  silent: boolean,
 *  verbose: boolean,
 *  quiet: boolean,
 *  dest: string,
 *  json: boolean
 * }} LegacyLoggingConfig
 */

function flattenConfigPath(configPath) {
  if (!Array.isArray(configPath)) {
    return configPath;
  }

  return configPath.join('.');
}

function transformLogging(configValue) {
  const loggingConfig = {
    root: { level: 'info' },
    appenders: { default: { kind: 'legacy-appender' } },
  };

  if (configValue.silent) {
    loggingConfig.root.level = 'off';
  } else if (configValue.quiet) {
    loggingConfig.root.level = 'error';
  } else if (configValue.verbose) {
    loggingConfig.root.level = 'all';
  }

  return loggingConfig;
}

function transformServer(configValue) {
  // TODO: New platform uses just a subset of `server` config from the legacy platform,
  // new values will be exposed once we need them (eg. customResponseHeaders, cors or xsrf).
  return {
    host: configValue.host,
    port: configValue.port,
    cors: configValue.cors,
    maxPayload: configValue.maxPayloadBytes,
    basePath: configValue.basePath,
    rewriteBasePath: configValue.rewriteBasePath,
    ssl: configValue.ssl,
  };
}

function isNewPlatformConfig(configPath) {
  if (Array.isArray(configPath)) {
    return configPath[0] === NEW_PLATFORM_CONFIG_ROOT;
  }

  return configPath.startsWith(NEW_PLATFORM_CONFIG_ROOT);
}

/**
 * Represents adapter between config provided by legacy platform and `RawConfig`
 * supported by the current platform.
 * @implements RawConfig
 */
export class LegacyConfigToRawConfigAdapter {
  /**
   * @type {ObjectToRawConfigAdapter}
   * @private
   */
  _newPlatformConfig;

  /**
   * @type {LegacyConfig}
   * @readonly
   * @private
   */
  _legacyConfig;

  constructor(legacyConfig) {
    this._legacyConfig = legacyConfig;
    this._newPlatformConfig = new ObjectToRawConfigAdapter({
      [NEW_PLATFORM_CONFIG_ROOT]:
        legacyConfig.get(NEW_PLATFORM_CONFIG_ROOT) || {},
    });
  }

  has(configPath) {
    if (isNewPlatformConfig(configPath)) {
      return this._newPlatformConfig.has(configPath);
    }

    return this._legacyConfig.has(flattenConfigPath(configPath));
  }

  get(configPath) {
    if (isNewPlatformConfig(configPath)) {
      return this._newPlatformConfig.get(configPath);
    }

    configPath = flattenConfigPath(configPath);

    const configValue = this._legacyConfig.get(configPath);

    switch (configPath) {
      case 'logging':
        return transformLogging(configValue);
      case 'server':
        return transformServer(configValue);
      default:
        return configValue;
    }
  }

  set(configPath, value) {
    if (isNewPlatformConfig(configPath)) {
      return this._newPlatformConfig.set(configPath, value);
    }

    this._legacyConfig.set(flattenConfigPath(configPath), value);
  }

  getFlattenedPaths() {
    // This method is only used to detect unused config paths, but when we run
    // new platform within the legacy one then the new platform is in charge of
    // only `__newPlatform` config node and the legacy platform will check the rest.
    return this._newPlatformConfig.getFlattenedPaths();
  }
}
