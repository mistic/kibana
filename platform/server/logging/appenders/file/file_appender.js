import { createWriteStream } from 'fs';
import { schema } from '@kbn/utils';
import { Layouts } from '../../layouts/layouts';

const { literal, object, string } = schema;

/**
 * Appender that formats all the `LogRecord` instances it receives and writes them to the specified file.
 * @internal
 */
export class FileAppender {
  static configSchema = object({
    kind: literal('file'),
    path: string(),
    layout: Layouts.configSchema,
  });

  /**
   * Writable file stream to write formatted `LogRecord` to.
   * @type {WriteStream}
   */
  _outputStream;

  /**
   * Creates FileAppender instance with specified layout and file path.
   * @param layout Instance of `Layout` sub-class responsible for `LogRecord` formatting.
   * @param path Path to the file where log records should be stored.
   */
  /**
   * Creates FileAppender instance with specified layout and file path.
   * @param layout Instance of `Layout` sub-class responsible for `LogRecord` formatting.
   * @param path Path to the file where log records should be stored.
   */
  constructor(layout, path) {
    this._layout = layout;
    this._path = path;
  }

  /**
   * Formats specified `record` and writes them to the specified file.
   * @param record `LogRecord` instance to be logged.
   */
  append(record) {
    if (this._outputStream === undefined) {
      this._outputStream = createWriteStream(this._path, {
        flags: 'a',
        encoding: 'utf8',
      });
    }

    this._outputStream.write(`${this._layout.format(record)}\n`);
  }

  /**
   * Disposes `FileAppender`. Waits for the underlying file stream to be completely flushed and closed.
   */
  async dispose() {
    await new Promise(resolve => {
      if (this._outputStream === undefined) {
        return resolve();
      }

      this._outputStream.end(undefined, undefined, () => {
        this._outputStream = undefined;
        resolve();
      });
    });
  }
}
