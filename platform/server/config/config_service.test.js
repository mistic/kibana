import {
  BehaviorSubject,
  k$,
  first,
  toPromise,
} from '../../lib/kbn_observable';
import { schema } from '@kbn/utils';

import { ConfigService, Env, ObjectToRawConfigAdapter } from '.';
import { logger } from '../logging/__mocks__';

const emptyArgv = {};
const defaultEnv = new Env('/kibana', emptyArgv);

function createClassWithSchema(s) {
  return class ExampleClassWithSchema {
    static schema = s;

    constructor(value) {
      this.value = value;
    }
  };
}

class ExampleClassWithStringSchema {
  static schema = schema.string();

  constructor(value) {
    this.value = value;
  }
}

test('returns config at path as observable', async () => {
  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter({ key: 'foo' })
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const configs = configService.atPath('key', ExampleClassWithStringSchema);
  const exampleConfig = await k$(configs)(first(), toPromise());

  expect(exampleConfig.value).toBe('foo');
});

test('throws if config at path does not match schema', async () => {
  expect.assertions(1);

  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter({ key: 123 })
  );

  const configService = new ConfigService(config$, defaultEnv, logger);
  const configs = configService.atPath('key', ExampleClassWithStringSchema);

  try {
    await k$(configs)(first(), toPromise());
  } catch (e) {
    expect(e.message).toMatchSnapshot();
  }
});

test("returns undefined if fetching optional config at a path that doesn't exist", async () => {
  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter({ foo: 'bar' })
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const configs = configService.optionalAtPath(
    'unique-name',
    ExampleClassWithStringSchema
  );
  const exampleConfig = await k$(configs)(first(), toPromise());

  expect(exampleConfig).toBeUndefined();
});

test('returns observable config at optional path if it exists', async () => {
  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter({ value: 'bar' })
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const configs = configService.optionalAtPath(
    'value',
    ExampleClassWithStringSchema
  );
  const exampleConfig = await k$(configs)(first(), toPromise());

  expect(exampleConfig).toBeDefined();
  expect(exampleConfig.value).toBe('bar');
});

test("does not push new configs when reloading if config at path hasn't changed", async () => {
  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter({ key: 'value' })
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const valuesReceived = [];
  configService
    .atPath('key', ExampleClassWithStringSchema)
    .subscribe(config => {
      valuesReceived.push(config.value);
    });

  config$.next(new ObjectToRawConfigAdapter({ key: 'value' }));

  expect(valuesReceived).toEqual(['value']);
});

test('pushes new config when reloading and config at path has changed', async () => {
  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter({ key: 'value' })
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const valuesReceived = [];
  configService
    .atPath('key', ExampleClassWithStringSchema)
    .subscribe(config => {
      valuesReceived.push(config.value);
    });

  config$.next(new ObjectToRawConfigAdapter({ key: 'new value' }));

  expect(valuesReceived).toEqual(['value', 'new value']);
});

test("throws error if config class does not implement 'schema'", async () => {
  expect.assertions(1);

  class ExampleClass {}

  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter({ key: 'value' })
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const configs = configService.atPath('key', ExampleClass);

  try {
    await k$(configs)(first(), toPromise());
  } catch (e) {
    expect(e).toMatchSnapshot();
  }
});

test('tracks unhandled paths', async () => {
  const initialConfig = {
    foo: 'value',
    bar: {
      deep1: {
        key: '123',
      },
      deep2: {
        key: '321',
      },
    },
    quux: {
      deep1: {
        key: 'hello',
      },
      deep2: {
        key: 'world',
      },
    },
  };

  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter(initialConfig)
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  configService.atPath('foo', createClassWithSchema(schema.string()));
  configService.atPath(
    ['bar', 'deep2'],
    createClassWithSchema(
      schema.object({
        key: schema.string(),
      })
    )
  );

  const unused = await configService.getUnusedPaths();

  expect(unused).toEqual(['bar.deep1.key', 'quux.deep1.key', 'quux.deep2.key']);
});

test('handles enabled path, but only marks the enabled path as used', async () => {
  const initialConfig = {
    pid: {
      enabled: true,
      file: '/some/file.pid',
    },
  };

  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter(initialConfig)
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const isEnabled = await configService.isEnabledAtPath('pid');
  expect(isEnabled).toBe(true);

  const unusedPaths = await configService.getUnusedPaths();
  expect(unusedPaths).toEqual(['pid.file']);
});

test('handles enabled path when path is array', async () => {
  const initialConfig = {
    pid: {
      enabled: true,
      file: '/some/file.pid',
    },
  };

  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter(initialConfig)
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const isEnabled = await configService.isEnabledAtPath(['pid']);
  expect(isEnabled).toBe(true);

  const unusedPaths = await configService.getUnusedPaths();
  expect(unusedPaths).toEqual(['pid.file']);
});

test('handles disabled path and marks config as used', async () => {
  const initialConfig = {
    pid: {
      enabled: false,
      file: '/some/file.pid',
    },
  };

  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter(initialConfig)
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const isEnabled = await configService.isEnabledAtPath('pid');
  expect(isEnabled).toBe(false);

  const unusedPaths = await configService.getUnusedPaths();
  expect(unusedPaths).toEqual([]);
});

test('treats config as enabled if config path is not present in config', async () => {
  const initialConfig = {};

  const config$ = new BehaviorSubject(
    new ObjectToRawConfigAdapter(initialConfig)
  );
  const configService = new ConfigService(config$, defaultEnv, logger);

  const isEnabled = await configService.isEnabledAtPath('pid');
  expect(isEnabled).toBe(true);

  const unusedPaths = await configService.getUnusedPaths();
  expect(unusedPaths).toEqual([]);
});
