import { schema } from '@kbn/utils';

import { JsonLayout } from './json_layout';
import { PatternLayout } from './pattern_layout';

const { oneOf } = schema;

/**
 * Entity that can format `LogRecord` instance into a string.
 *
 * @interface Layout
 */

/**
 * Formats log record.
 *
 * @function
 * @name Layout#format
 * @returns {string} Formatted log record as a string.
 */

export class Layouts {
  static configSchema = oneOf([
    JsonLayout.configSchema,
    PatternLayout.configSchema,
  ]);

  /**
   * Factory method that creates specific `Layout` instances based on the passed `config` parameter.
   * @param config Configuration specific to a particular `Layout` implementation.
   * @returns {Layout} Fully constructed `Layout` instance.
   */
  static create(config) {
    switch (config.kind) {
      case 'json':
        return new JsonLayout();

      case 'pattern':
        return new PatternLayout(config.pattern, config.highlight);

      default:
        throw new Error(`Unknown layout type: ${config.kind}`);
    }
  }
}
