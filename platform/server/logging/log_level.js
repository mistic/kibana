/**
 * Possible log level string values.
 */
const LOG_LEVEL_IDS = new Set([
  'all',
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'off',
]);

/**
 * Represents the log level, manages string -> `LogLevel` conversion and comparison of log level
 * priorities between themselves.
 * @internal
 */
export class LogLevel {
  static Off = new LogLevel('off', 1);
  static Fatal = new LogLevel('fatal', 2);
  static Error = new LogLevel('error', 3);
  static Warn = new LogLevel('warn', 4);
  static Info = new LogLevel('info', 5);
  static Debug = new LogLevel('debug', 6);
  static Trace = new LogLevel('trace', 7);
  static All = new LogLevel('all', 8);

  constructor(id, value) {
    if (!LOG_LEVEL_IDS.has(id)) {
      throw new Error(`Unknown log level: ${id}.`);
    }

    this.id = id;
    this.value = value;
  }

  /**
   * Indicates whether current log level covers the one that is passed as an argument.
   * @param {LogLevel} level Instance of `LogLevel` to compare to.
   * @returns {boolean} True if specified `level` is covered by this log level.
   */
  supports(level) {
    return this.value >= level.value;
  }

  /**
   * Converts string representation of log level into `LogLevel` instance.
   * @param {string} level String representation of log level.
   * @returns {LogLevel} Instance of `LogLevel` class.
   */
  static fromId(level) {
    switch (level) {
      case 'all':
        return LogLevel.All;
      case 'fatal':
        return LogLevel.Fatal;
      case 'error':
        return LogLevel.Error;
      case 'warn':
        return LogLevel.Warn;
      case 'info':
        return LogLevel.Info;
      case 'debug':
        return LogLevel.Debug;
      case 'trace':
        return LogLevel.Trace;
      case 'off':
        return LogLevel.Off;
      default:
        if (LOG_LEVEL_IDS.has(level)) {
          throw new Error(`Unknown log level: ${level}.`);
        }
    }
  }
}
