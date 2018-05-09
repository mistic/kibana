import { schema } from '@kbn/utils';

const { literal, object } = schema;

const jsonLayoutSchema = object({
  kind: literal('json'),
});

function errorToSerializableObject(error) {
  if (error === undefined) {
    return error;
  }

  return {
    name: error.name,
    stack: error.stack,
    message: error.message,
  };
}

/**
 * Layout that just converts `LogRecord` into JSON string.
 */
export class JsonLayout {
  static configSchema = jsonLayoutSchema;

  format(record) {
    return JSON.stringify({
      '@timestamp': record.timestamp.toISOString(),
      level: record.level.id.toUpperCase(),
      context: record.context,
      message: record.message,
      error: errorToSerializableObject(record.error),
      meta: record.meta,
    });
  }
}
