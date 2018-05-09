import { schema } from '@kbn/utils';
import { ConsoleAppender } from './console/console_appender';
import { FileAppender } from './file/file_appender';
import { LegacyAppender } from '../../legacy_compat/logging/appenders/legacy_appender';
import { Layouts } from '../layouts/layouts';

const appendersSchema = schema.oneOf([
  ConsoleAppender.configSchema,
  FileAppender.configSchema,
  LegacyAppender.configSchema,
]);

/**
 * Entity that can append `LogRecord` instances to file, stdout, memory or whatever
 * is implemented internally. It's supposed to be used by `Logger`.
 *
 * @interface Appender
 */

/**
 * Appends the record to log.
 *
 * @function
 * @name Appender#append
 * @param {LogRecord} record Log record to append.
 * @returns {LogRecord} Formatted log record as a string.
 */

export class Appenders {
  static configSchema = appendersSchema;

  /**
   * Factory method that creates specific `Appender` instances based on the passed `config` parameter.
   * @param config Configuration specific to a particular `Appender` implementation.
   * @param env Current environment that is required by some appenders.
   * @returns {Appender} Fully constructed `Appender` instance.
   */
  static create(config, env) {
    switch (config.kind) {
      case 'console':
        return new ConsoleAppender(Layouts.create(config.layout));

      case 'file':
        return new FileAppender(Layouts.create(config.layout), config.path);

      case 'legacy-appender':
        const legacyKbnServer = env.getLegacyKbnServer();
        if (legacyKbnServer === undefined) {
          throw new Error('Legacy appender requires kbnServer.');
        }
        return new LegacyAppender(legacyKbnServer);

      default:
        throw new Error(`Unknown appender: ${config.kind}`);
    }
  }
}
