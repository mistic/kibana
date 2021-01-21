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

import globby from 'globby';
import del from 'del';
import { basename, resolve } from 'path';
import { existsSync, chmodSync } from 'fs';
import { REPO_ROOT } from '@kbn/dev-utils';
import { ICommand } from './';
import { spawn } from '../utils/child_process';
import { readFile, copyDirectory } from '../utils/fs';
import { log } from '../utils/log';
import { topologicallyBatchProjects } from '../utils/projects';
import { parallelizeBatches } from '../utils/parallelize';
import { linkProjectExecutables } from '../utils/link_project_executables';

export const BootstrapCommand: ICommand = {
  description: 'Install dependencies and crosslink projects',
  name: 'bootstrap',

  async run(projects, projectGraph, { options, kbn, rootPath }) {
    // Get defined bazelisk version and install it if needed
    const bazeliskVersion = (await readFile(resolve(rootPath, '.bazeliskversion')))
      .toString()
      .split('\n')[0];
    if (!bazeliskVersion) {
      log.error('.bazeliskversion file do not contain any version set');
    }

    const { stdout } = await spawn('yarn', ['global', 'list'], { stdio: 'pipe' });
    if (!stdout.includes(`@bazel/bazelisk@${bazeliskVersion}`)) {
      await spawn('yarn', ['global', 'add', `@bazel/bazelisk@${bazeliskVersion}`], {});
    }

    // Run bazel to build packages
    // await spawn('bazel', ['run', '@nodejs//:yarn'], {});
    const bazelArgs = ['build', '//packages:build'];
    if (options.ci === true) {
      bazelArgs.push('--config=ci');
    }
    await spawn('bazel', bazelArgs, {});

    // Create node_modules/bin for every project
    await linkProjectExecutables(projects, projectGraph);

    // TODO: That runs kbn:bootstrap tasks. Do we want to support it?
    const batchedProjects = topologicallyBatchProjects(projects, projectGraph);
    await parallelizeBatches(batchedProjects, async (project) => {
      // const bazelDistProjectTarget = resolve(
      //   REPO_ROOT,
      //   'bazel-dist/bin/packages',
      //   basename(project.path),
      //   'npm_module/target'
      // );
      // if (project.path.includes('packages') && existsSync(bazelDistProjectTarget)) {
      //   const paths = await globby([`${bazelDistProjectTarget}/**/*`], {
      //     expandDirectories: true,
      //     onlyFiles: false,
      //   });
      //   paths.push(bazelDistProjectTarget);
      //   paths.forEach((path) => chmodSync(path, 0o755));
      //
      //   if (existsSync(project.targetLocation)) {
      //     await del(project.targetLocation);
      //   }
      //
      //   await copyDirectory(bazelDistProjectTarget, project.targetLocation);
      // }

      if (project.isWorkspaceRoot) {
        log.info(`[${project.name}] running [kbn:bootstrap] script`);
        await project.runScriptStreaming('kbn:bootstrap');
        log.success(`[${project.name}] bootstrap complete`);
      }
    });
  },
};
