import { schema } from '@kbn/utils';
import { Layouts } from '../../layouts/layouts';

const { literal, object } = schema;

/**
 * Appender that formats all the `LogRecord` instances it receives and logs them via built-in `console`.
 */
export class ConsoleAppender {
  static configSchema = object({
    kind: literal('console'),
    layout: Layouts.configSchema,
  });

  /**
   * Creates ConsoleAppender instance.
   * @param layout Instance of `Layout` sub-class responsible for `LogRecord` formatting.
   */
  constructor(layout) {
    this._layout = layout;
  }

  /**
   * Formats specified `record` and logs it via built-in `console`.
   * @param {LogRecord} record `LogRecord` instance to be logged.
   */
  append(record) {
    console.log(this._layout.format(record));
  }

  /**
   * Disposes `ConsoleAppender`.
   */
  dispose() {}
}
