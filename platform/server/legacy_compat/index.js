export { LegacyPlatformProxifier } from './legacy_platform_proxifier';
export { LegacyConfigToRawConfigAdapter } from './legacy_platform_config';
export { LegacyKbnServer } from './legacy_kbn_server';

import { k$, map, BehaviorSubject } from '../../lib/kbn_observable';
import { Root } from '../root';
import { Env } from '../config';
import {
  LegacyKbnServer,
  LegacyPlatformProxifier,
  LegacyConfigToRawConfigAdapter,
} from '.';

/**
 * @internal
 */
export const injectIntoKbnServer = rawKbnServer => {
  const legacyConfig$ = new BehaviorSubject(rawKbnServer.config);
  const config$ = k$(legacyConfig$)(
    map(legacyConfig => new LegacyConfigToRawConfigAdapter(legacyConfig))
  );

  rawKbnServer.newPlatform = {
    // Custom HTTP Listener that will be used within legacy platform by HapiJS server.
    proxyListener: new LegacyPlatformProxifier(
      new Root(
        config$,
        Env.createDefault({ kbnServer: new LegacyKbnServer(rawKbnServer) })
      )
    ),

    // Propagates legacy config updates to the new platform.
    updateConfig(legacyConfig) {
      legacyConfig$.next(legacyConfig);
    },
  };
};
