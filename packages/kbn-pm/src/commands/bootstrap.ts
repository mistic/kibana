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

import { resolve } from 'path';
import { ICommand } from './';
import { spawn } from '../utils/child_process';
import { readFile } from '../utils/fs';
import { log } from '../utils/log';

export const BootstrapCommand: ICommand = {
  description: 'Install dependencies and crosslink projects',
  name: 'bootstrap',

  async run(projects, projectGraph, { options, kbn, rootPath }) {
    // TODO: fix preinstall check to allow that command

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

    // Run bazel to sync and fetch workspace
    // await spawn('bazel', ['sync'], {});
    await spawn('bazel', ['run', '@nodejs//:yarn'], {});

    // Run bazel to build packages
    await spawn('bazel', ['build', '//packages:build'], {});
  },
};
