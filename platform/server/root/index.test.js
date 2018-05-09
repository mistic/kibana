jest.mock('../config/config_service', () => ({ ConfigService: jest.fn() }));
jest.mock('..', () => ({ Server: jest.fn() }));
jest.mock('../logging/logging_service', () => ({ LoggingService: jest.fn() }));
jest.mock('../logging/logger_factory', () => ({
  MutableLoggerFactory: jest.fn(),
}));

const loggerConfig = {};
const configService = {
  atPath: jest.fn(() => loggerConfig),
};

import { ConfigService as MockConfigService } from '../config/config_service';
MockConfigService.mockImplementation(() => configService);

const server = {
  start: jest.fn(),
  stop: jest.fn(),
};

import { Server as MockServer } from '..';
MockServer.mockImplementation(() => server);

const loggingService = {
  upgrade: jest.fn(),
  stop: jest.fn(),
};

import { LoggingService as MockLoggingService } from '../logging/logging_service';
MockLoggingService.mockImplementation(() => loggingService);

const logger = {
  get: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
};

import { MutableLoggerFactory as MockMutableLoggerFactory } from '../logging/logger_factory';
MockMutableLoggerFactory.mockImplementation(() => logger);

import { BehaviorSubject } from '../../lib/kbn_observable';
import { Root } from '.';
import { Env } from '../config';

const env = new Env('.', {});
const config$ = new BehaviorSubject({});

const mockProcessExit = jest
  .spyOn(global.process, 'exit')
  .mockImplementation(() => {});
afterEach(() => {
  mockProcessExit.mockReset();
});

test('starts services on "start"', async () => {
  const root = new Root(config$, env);

  expect(loggingService.upgrade).toHaveBeenCalledTimes(0);
  expect(server.start).toHaveBeenCalledTimes(0);

  await root.start();

  expect(loggingService.upgrade).toHaveBeenCalledTimes(1);
  expect(loggingService.upgrade).toHaveBeenLastCalledWith(loggerConfig);
  expect(server.start).toHaveBeenCalledTimes(1);
});

test('stops services on "shutdown"', async () => {
  const root = new Root(config$, env);

  await root.start();

  expect(loggingService.stop).toHaveBeenCalledTimes(0);
  expect(server.stop).toHaveBeenCalledTimes(0);

  await root.shutdown();

  expect(loggingService.stop).toHaveBeenCalledTimes(1);
  expect(server.stop).toHaveBeenCalledTimes(1);
});

test('calls onShutdown param on "shutdown"', async () => {
  const onShutdown = jest.fn();

  const root = new Root(config$, env, onShutdown);

  await root.start();

  expect(onShutdown).toHaveBeenCalledTimes(0);

  const err = new Error('shutdown');

  await root.shutdown(err);

  expect(onShutdown).toHaveBeenCalledTimes(1);
  expect(onShutdown).toHaveBeenLastCalledWith(err);
});

describe('when configuring logger fails', () => {
  const logged = jest.spyOn(console, 'error');

  beforeEach(() => {
    logged.mockImplementation(() => {});
  });

  afterEach(() => {
    logged.mockRestore();
  });

  test('calls shutdown', async () => {
    const onShutdown = jest.fn();

    const root = new Root(config$, env, onShutdown);
    const err = new Error('foo bar baz');

    configService.atPath.mockImplementationOnce(() => {
      throw err;
    });

    MockServer.mockClear();

    await expect(root.start()).rejects.toMatchSnapshot();

    expect(MockServer).not.toHaveBeenCalled();

    expect(onShutdown).toHaveBeenCalledTimes(1);
    expect(onShutdown).toHaveBeenLastCalledWith(err);

    expect(logged.mock.calls).toMatchSnapshot();
  });
});
