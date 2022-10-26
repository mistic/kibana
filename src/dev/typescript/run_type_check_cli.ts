/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import Path from 'path';
import { run } from '@kbn/dev-cli-runner';
import { createFailError } from '@kbn/dev-cli-errors';
import { REPO_ROOT } from '@kbn/utils';

import { PROJECTS } from './projects';
import { buildTsRefs } from './build_ts_refs';
import { updateRootRefsConfig } from './root_refs_config';

export async function runTypeCheckCli() {
  run(
    async ({ log, flags, procRunner }) => {
      // TODO: encapsulate this
      // run type builds for packages
      const BAZEL_RUNNER_SRC = '../../../packages/kbn-bazel-runner/index.js';
      const { runBazel } = await import(BAZEL_RUNNER_SRC);
      await runBazel(['build', '//packages:build_types', '--show_result=1'], {
        cwd: REPO_ROOT,
        logPrefix: '\x1b[94m[bazel]\x1b[39m',
        onErrorExit(code: any, output: any) {
          throw createFailError(
            `The bazel command that was running exited with code [${code}] and output: ${output}`
          );
        },
      });

      // if the tsconfig.refs.json file is not self-managed then make sure it has
      // a reference to every composite project in the repo
      await updateRootRefsConfig(log);

      const projectFilter =
        flags.project && typeof flags.project === 'string'
          ? Path.resolve(flags.project)
          : undefined;

      const projects = PROJECTS.filter((p) => {
        return !p.disableTypeCheck && (!projectFilter || p.tsConfigPath === projectFilter);
      });

      // TODO: remove temporary refs file when finishing the typecheck

      if (projects.length > 1 || projects[0].isCompositeProject()) {
        const { failed } = await buildTsRefs({
          log,
          procRunner,
          verbose: !!flags.verbose,
          project: projects.length === 1 ? projects[0] : undefined,
        });
        if (failed) {
          throw createFailError('Unable to build TS project refs');
        }
      }

      if (!projects.length) {
        if (projectFilter) {
          throw createFailError(`Unable to find project at ${flags.project}`);
        } else {
          throw createFailError(`Unable to find projects to type-check`);
        }
      }
    },
    {
      description: `
        Run the TypeScript compiler without emitting files so that it can check types during development.

        Examples:
          # check types in all projects
          node scripts/type_check

          # check types in a single project
          node scripts/type_check --project packages/kbn-pm/tsconfig.json
      `,
      flags: {
        string: ['project'],
        help: `
          --project [path]        Path to a tsconfig.json file determines the project to check
          --help                  Show this message
        `,
      },
    }
  );
}
