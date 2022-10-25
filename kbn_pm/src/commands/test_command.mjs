/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { packagesDiscovery } from './bootstrap/packages.mjs';
import Fs from 'fs';

/** @type {import('../lib/command').Command} */
export const command = {
  name: '_test',
  async run({ log }) {
    log.success('empty');

    const packages = await packagesDiscovery();

    // include types field
    packages.forEach((pkg) => {
      const isTsConfigAvail = Fs.existsSync(`${pkg.normalizedRepoRelativeDir}/tsconfig.json`);

      if (isTsConfigAvail) {
        pkg.pkg.types = './target_types/index.d.ts'
        Fs.writeFileSync(`${pkg.normalizedRepoRelativeDir}/package.json`, JSON.stringify(pkg.pkg, null, 2))
      }
    });
  },
};
