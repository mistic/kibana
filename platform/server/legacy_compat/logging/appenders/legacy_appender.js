import { schema } from '@kbn/utils';

const { literal, object } = schema;

/**
 * Simple appender that just forwards `LogRecord` to the legacy KbnServer log.
 */
export class LegacyAppender {
  static configSchema = object({
    kind: literal('legacy-appender'),
  });

  constructor(kbnServer) {
    this._kbnServer = kbnServer;
  }

  /**
   * Forwards `LogRecord` to the legacy platform that will layout and
   * write record to the configured destination.
   * @param record `LogRecord` instance to forward to.
   */
  append(record) {
    this._kbnServer.log(
      [record.level.id.toLowerCase(), ...record.context.split('.')],
      record.error || record.message,
      record.timestamp
    );
  }

  async dispose() {}
}
