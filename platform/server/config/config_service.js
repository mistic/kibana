import {
  k$,
  map,
  first,
  skipRepeats,
  toPromise,
} from '../../lib/kbn_observable';
import { isEqual } from 'lodash';

/**
 * Interface that defines the static side of a config class.
 *
 * (Remember that a class has two types: the type of the static side and the
 * type of the instance side, see https://www.typescriptlang.org/docs/handbook/interfaces.html#difference-between-the-static-and-instance-sides-of-classes)
 *
 * This can't be used to define the config class because of how interfaces work
 * in TypeScript, but it can be used to ensure we have a config class that
 * matches whenever it's used.
 *
 * @interface ConfigWithSchema
 */

/**
 * Any config class must define a schema that validates the config, based on
 * the injected `schema` helper.
 *
 * @property
 * @name ConfigWithSchema#schema
 * @type {schema.Any}
 */

/**
 * @param {string|string[]} configPath
 * @returns {string}
 */
const createPluginEnabledPath = configPath => {
  if (Array.isArray(configPath)) {
    return configPath.concat('enabled');
  }

  return `${configPath}.enabled`;
};

/**
 * @param {string|string[]} path
 * @returns {string}
 */
const pathToString = path => (Array.isArray(path) ? path.join('.') : path);

/**
 * A path is considered 'handled' if it is a subset of any of the already
 * handled paths.
 * @param {string} path
 * @param {string[]} handledPaths
 */
const isPathHandled = (path, handledPaths) =>
  handledPaths.some(handledPath => path.startsWith(handledPath));

export class ConfigService {
  /**
   * @type {Logger}
   * @readonly
   * @private
   */
  _log;

  /**
   * Whenever a config if read at a path, we mark that path as 'handled'. We can
   * then list all unhandled config paths when the startup process is completed.
   * @type {Array<string|string[]>}
   * @readonly
   * @private
   */
  _handledPaths = [];

  /**
   * @type {Observable<RawConfig>}
   * @readonly
   * @private
   */
  _config$;

  /**
   * @type {Env}
   * @readonly
   */
  env;

  constructor(config$, env, logger) {
    this._config$ = config$;
    this._log = logger.get('config');

    this.env = env;
  }

  /**
   * Returns the full config object observable. This is not intended for
   * "normal use", but for features that _need_ access to the full object.
   */
  getConfig$() {
    return this._config$;
  }

  /**
   * Reads the subset of the config at the specified `path` and validates it
   * against the static `schema` on the given `ConfigClass`.
   *
   * @param {string|string[]} path The path to the desired subset of the config.
   * @param {function} ConfigClass A class (not an instance of a class)
   * that contains a static `schema` that we validate the config at the given `path` against.
   */
  atPath(path, ConfigClass) {
    return k$(this._getDistinctRawConfig(path))(
      map(rawConfig => this._createConfig(path, rawConfig, ConfigClass))
    );
  }

  /**
   * Same as `atPath`, but returns `undefined` if there is no config at the
   * specified path.
   * @param {string|string[]} path
   * @param {function} ConfigClass
   * @see atPath
   */
  optionalAtPath(path, ConfigClass) {
    return k$(this._getDistinctRawConfig(path))(
      map(
        rawConfig =>
          rawConfig === undefined
            ? undefined
            : this._createConfig(path, rawConfig, ConfigClass)
      )
    );
  }

  /**
   * @param {string|string[]} path
   * @returns {Promise<boolean>}
   */
  async isEnabledAtPath(path) {
    const enabledPath = createPluginEnabledPath(path);

    const config = await k$(this._config$)(first(), toPromise());

    if (!config.has(enabledPath)) {
      return true;
    }

    const isEnabled = config.get(enabledPath);

    if (isEnabled === false) {
      // If the plugin is _not_ enabled, we mark the entire plugin path as
      // handled, as it's expected that it won't be used.
      this._markAsHandled(path);
      return false;
    }

    // If plugin enabled we mark the enabled path as handled, as we for example
    // can have plugins that don't have _any_ config except for this field, and
    // therefore have no reason to try to get the config.
    this._markAsHandled(enabledPath);
    return true;
  }

  /**
   * @param {string|string[]} path
   * @param {Object} rawConfig
   * @param {function} ConfigClass
   * @returns {ConfigWithSchema<Schema, Config>}
   * @private
   */
  _createConfig(path, rawConfig, ConfigClass) {
    const context = Array.isArray(path) ? path.join('.') : path;

    const configSchema = ConfigClass.schema;

    if (
      configSchema === undefined ||
      typeof configSchema.validate !== 'function'
    ) {
      throw new Error(
        `The config class [${
          ConfigClass.name
        }] did not contain a static 'schema' field, which is required when creating a config instance`
      );
    }

    const config = ConfigClass.schema.validate(rawConfig, context);
    return new ConfigClass(config, this.env);
  }

  /**
   * @param {string|string[]} path
   * @returns {Observable<Config>}
   * @private
   */
  _getDistinctRawConfig(path) {
    this._markAsHandled(path);

    return k$(this._config$)(
      map(config => config.get(path)),
      skipRepeats(isEqual)
    );
  }

  /**
   * @param {string|string[]} path
   * @private
   */
  _markAsHandled(path) {
    this._log.debug(`Marking config path as handled: ${path}`);
    this._handledPaths.push(path);
  }

  /**
   * @returns {Promise<string[]>}
   */
  async getUnusedPaths() {
    const config = await k$(this._config$)(first(), toPromise());
    const handledPaths = this._handledPaths.map(pathToString);

    return config
      .getFlattenedPaths()
      .filter(path => !isPathHandled(path, handledPaths));
  }
}
