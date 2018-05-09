/**
 * Simple appender that just buffers `LogRecord` instances it receives. It is a *reserved* appender
 * that can't be set via configuration file.
 */
export class BufferAppender {
  /**
   * List of the buffered `LogRecord` instances.
   * @type {LogRecord[]}
   */
  _buffer = [];

  /**
   * Appends new `LogRecord` to the buffer.
   * @param record `LogRecord` instance to add to the buffer.
   */
  append(record) {
    this._buffer.push(record);
  }

  /**
   * Clears buffer and returns all records that it had.
   */
  flush() {
    return this._buffer.splice(0, this._buffer.length);
  }

  /**
   * Disposes `BufferAppender` and clears internal `LogRecord` buffer.
   */
  async dispose() {
    this.flush();
  }
}
