/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolve } from 'path';

import { ScoutTestRunConfigCategory } from '@kbn/scout-info';
import type { FtrConfigProviderContext } from '@kbn/test';

import { services } from './services';

// the default export of config files must be a config provider
// that returns an object with the projects config values
export default async function ({ readConfigFile }: FtrConfigProviderContext) {
  const xPackAPITestsConfig = await readConfigFile(require.resolve('../api_integration/config.ts'));

  const kibanaPort = xPackAPITestsConfig.get('servers.kibana.port');
  const idpPath = require.resolve('@kbn/security-api-integration-helpers/saml/idp_metadata.xml');

  const testEndpointsPlugin = resolve(__dirname, '../security_functional/plugins/test_endpoints');

  return {
    testConfigCategory: ScoutTestRunConfigCategory.API_TEST,
    testFiles: [resolve(__dirname, './tests/session_shard_missing')],
    services,
    servers: xPackAPITestsConfig.get('servers'),
    esTestCluster: {
      ...xPackAPITestsConfig.get('esTestCluster'),
      serverArgs: [
        ...xPackAPITestsConfig.get('esTestCluster.serverArgs'),
        'xpack.security.authc.token.enabled=true',
        'xpack.security.authc.token.timeout=15s',
        'xpack.security.authc.realms.saml.saml1.order=0',
        `xpack.security.authc.realms.saml.saml1.idp.metadata.path=${idpPath}`,
        'xpack.security.authc.realms.saml.saml1.idp.entity_id=http://www.elastic.co/saml1',
        `xpack.security.authc.realms.saml.saml1.sp.entity_id=http://localhost:${kibanaPort}`,
        `xpack.security.authc.realms.saml.saml1.sp.logout=http://localhost:${kibanaPort}/logout`,
        `xpack.security.authc.realms.saml.saml1.sp.acs=http://localhost:${kibanaPort}/api/security/saml/callback`,
        'xpack.security.authc.realms.saml.saml1.attributes.principal=urn:oid:0.0.7',
      ],
    },

    kbnTestServer: {
      ...xPackAPITestsConfig.get('kbnTestServer'),
      serverArgs: [
        ...xPackAPITestsConfig.get('kbnTestServer.serverArgs'),
        `--plugin-path=${testEndpointsPlugin}`,
        '--xpack.security.session.idleTimeout=10s',
        '--xpack.security.session.cleanupInterval=20s',
        `--xpack.security.authc.providers=${JSON.stringify({
          basic: { basic1: { order: 0 } },
          saml: {
            saml_fallback: { order: 1, realm: 'saml1' },
            saml_override: { order: 2, realm: 'saml1', session: { idleTimeout: '2m' } },
            saml_disable: { order: 3, realm: 'saml1', session: { idleTimeout: 0 } },
          },
        })}`,
        // Exclude Uptime tasks to not interfere (additional ES load) with the session cleanup task.
        `--xpack.task_manager.unsafe.exclude_task_types=${JSON.stringify(['UPTIME:*'])}`,
      ],
    },

    junit: {
      reportName: 'X-Pack Security API Integration Tests (Session Idle Timeout)',
    },
  };
}
