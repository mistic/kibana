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

import { deleteAll } from '../lib';
import { dirname, relative } from 'path';
import { Bundle } from 'nexe-fs';
import { promisify } from 'bluebird';
import fs from 'fs';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const lstat = promisify(fs.lstat);
const copyFile = promisify(fs.copyFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export const CreateStaticFilesystem = {
  description:
    'Creating StaticModulesFs and patching entryPoints',

  async run(config, log, build) {
    const patchEntryPoints = async (entryPoints, staticModulesBootstrap, staticModulesPatch, staticModulesIndex, staticModulesFs) => {
      for (const each of entryPoints) {
        const entrypoint = require.resolve(build.resolvePath(each));

        const isDir = (await lstat(entrypoint)).isDirectory();
        if (!isDir) {
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
          const patchLine = `const staticFsPatch = require('${patchPath}');`;
          const indexLine = `const staticFsIndex = JSON.parse(require('fs').readFileSync(require.resolve('${indexPath}')));`;
          const shimLine = `staticFsPatch.shimFs({
            blobPath: require.resolve('${fsPath}'),
            resources: staticFsIndex,
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

    const addAllFilesFromFolder = async (bundle, source) => {
      const files = await readdir(source);
      const all = [];

      for (const file of files) {
        // compute the path names
        const sourcePath = `${source}/${file}`;

        // is this a directory
        const ss = await stat(sourcePath);
        if (ss.isDirectory()) {
          all.push(addAllFilesFromFolder(bundle, sourcePath));
        } else {
          await bundle.addResource(sourcePath, (await readFile(sourcePath)));
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
      await mkdir(staticModulesDir);
      const sourceBootstrapFile = require.resolve(`nexe-fs/bootstrap`);
      await copyFile(sourceBootstrapFile, staticModulesBootstrap);
      const sourcePatchFile = require.resolve(`nexe-fs/patch`);
      await copyFile(sourcePatchFile, staticModulesPatch);

      // 2nd patch entrypoints
      await patchEntryPoints(entryPointsToPatch, staticModulesBootstrap, staticModulesPatch, staticModulesIndex, staticModulesFs);

      // 3rd create and load static fs
      const oldCWD = process.cwd();
      process.chdir(build.resolvePath('.'));
      const bundle = new Bundle();
      await addAllFilesFromFolder(bundle, nodeModulesDir);
      await bundle.toStream().pipe(fs.createWriteStream(staticModulesFs));
      await writeFile(staticModulesIndex, JSON.stringify(bundle.index));
      process.chdir(oldCWD);
    };

    // Init and wait completion for the node_modules bundle and patched server code
    await generateServerBundle();

    // Delete node_modules folder
    const nodeModulesDir = build.resolvePath('node_modules');
    await deleteAll(
      log,
      [
        `${nodeModulesDir}/**`
      ]
    );
  }
};
