/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

module.exports = {
  coverageDirectory: '<rootDir>/target/kibana-coverage/jest/x-pack/packages/kbn_ai_assistant_src',
  coverageReporters: ['text', 'html'],
  collectCoverageFrom: [
    '<rootDir>/x-pack/platform/packages/shared/kbn-ai-assistant/src/**/*.{ts,tsx}',
    '!<rootDir>/x-pack/platform/packages/shared/kbn-ai-assistant/src/*.test.{ts,tsx}',
  ],
  preset: '@kbn/test',
  rootDir: '../../../../..',
  roots: ['<rootDir>/x-pack/platform/packages/shared/kbn-ai-assistant'],
};
