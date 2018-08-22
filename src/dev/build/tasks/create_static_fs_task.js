/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// import { deleteAll } from '../lib';
import { dirname, relative } from 'path';
import { isFile, writeFile, copyFile, readFile, readdir, stat } from 'static-fs/dist/lib/common';
import { Bundle } from 'nexe-fs';
import { createWriteStream } from 'fs';

export const CreateStaticFilesystem = {
  description:
    'Creating StaticModulesFs and patching entryPoints',

  async run(config, log, build) {
    const patchEntryPoints = async (entryPoints, staticModulesBootstrap, staticModulesPatch, staticModulesIndex, staticModulesFs) => {
      for (const each of entryPoints) {
        const entrypoint = require.resolve(build.resolvePath(each));

        if (await isFile(entrypoint)) {
          let bootstrapPath = relative(dirname(entrypoint), staticModulesBootstrap).replace(/\\/g, '/');
          let patchPath = relative(dirname(entrypoint), staticModulesPatch).replace(/\\/g, '/');
          let indexPath = relative(dirname(entrypoint), staticModulesIndex).replace(/\\/g, '/');
          let fsPath = relative(dirname(entrypoint), staticModulesFs).replace(/\\/g, '/');
          if (bootstrapPath.charAt(0) !== '.') {
            bootstrapPath = `./${bootstrapPath}`;
          }
          if (patchPath.charAt(0) !== '.') {
            patchPath = `./${patchPath}`;
          }
          if (indexPath.charAt(0) !== '.') {
            indexPath = `./${indexPath}`;
          }
          if (fsPath.charAt(0) !== '.') {
            fsPath = `./${fsPath}`;
          }

          let content = await readFile(entrypoint, { encoding: 'utf8' });
          const bootstrapLine = `require('${bootstrapPath}');`;
          const patchLine = `const patch = require('${patchPath}');`;
          const indexLine = `const fsIndex = JSON.parse(require('fs').readFileSync(require.resolve('${indexPath}')));`;
          const shimLine = `patch.shimFs({
            blobPath: require.resolve('${fsPath}'),
            resources: fsIndex.index,
            layout: {
              stat: require('fs').statSync(require.resolve('${indexPath}')),
              resourceStart: 0
            }
          });`;

          content = `${bootstrapLine}\n${patchLine}\n${indexLine}\n${shimLine}\n${content}`;
          await writeFile(entrypoint, content);
        }
      }
    };

    const addAllFilesFromFolder = async (bundle, source, target) => {
      const files = await readdir(source);
      const all = [];

      for (const file of files) {
        // compute the path names
        const sourcePath = `${source}/${file}`;
        const targetPath = `${target}/${file}`;

        // is this a directory
        const ss = await stat(sourcePath);
        if (ss.isDirectory()) {
          all.push(addAllFilesFromFolder(bundle, sourcePath, targetPath));
        } else {
          await bundle.addResource(sourcePath);
        }
      }
      // wait for children to finish
      await Promise.all(all);
    };

    const generateServerBundle = async () => {
      const nodeModulesDir = build.resolvePath('node_modules');
      const staticModulesDir = build.resolvePath('static_modules');
      const staticModulesFs = build.resolvePath(staticModulesDir, 'static_modules.fs');
      const staticModulesIndex = build.resolvePath(staticModulesDir, 'static_modules.index');
      const staticModulesBootstrap = build.resolvePath(staticModulesDir, 'static_bootstrap.js');
      const staticModulesPatch = build.resolvePath(staticModulesDir, 'static_patch.js');
      const entryPointsToPatch = [
        'src/setup_node_env/babel_register'
      ];

      // 1st copy loader and patch
      const sourceFile = require.resolve(`nexe-fs/bootstrap`);
      await copyFile(sourceFile, staticModulesBootstrap);
      const sourceFile2 = require.resolve(`nexe-fs/patch`);
      await copyFile(sourceFile2, staticModulesPatch);

      // 2nd patch entrypoints
      await patchEntryPoints(entryPointsToPatch, staticModulesBootstrap, staticModulesPatch, staticModulesIndex, staticModulesFs);

      // 3rd create and load static fs
      const bundle = new Bundle({ cwd: '/' });
      await addAllFilesFromFolder(bundle, nodeModulesDir, 'node_modules');
      bundle.toStream().pipe(createWriteStream(staticModulesFs));
      await writeFile(staticModulesIndex, JSON.stringify(bundle));
    };

    await generateServerBundle();

    // // Delete node_modules folder
    // const nodeModulesDir = build.resolvePath('node_modules');
    //
    // await deleteAll(
    //   log,
    //   [
    //     `${nodeModulesDir}/**`
    //   ]
    // );
  }
};
