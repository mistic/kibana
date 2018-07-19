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

import NormalModule from 'webpack/lib/NormalModule';
import { fromRoot } from '../../../utils';
import path from 'path';
import webpack from 'webpack';

export class BridgePlugin {
  constructor({ compilerProcess, dllConfig }) {
    this.compilerProcess = compilerProcess;
    this.dllConfig = dllConfig;
    this.nodeModulesEntryPaths = {};

    this.stopCompilerWhenNeeded();
  }

  apply(compiler) {

    compiler.hooks.compile.tap({
      name: 'dllBundlerBridgePlugin-buildEntryPaths',
      fn: ({ normalModuleFactory }) => {
        this.buildEntryPaths(normalModuleFactory);
        new webpack.DllReferencePlugin({
          context: this.dllConfig.context,
          manifest: require.resolve(`${ this.dllConfig.outputPath }/vendor.json`),
        }).apply(compiler);
      }
    });

    compiler.hooks.done.tap({
      name: 'dllBundlerBridgePlugin-sendEntryPaths',
      fn: () => {
        if (!this.sent) {
          this.sendEntryPaths();
          this.sent = true;
        }
      }
    });

    /*compiler.hooks.shouldEmit.tap({
      name: 'dllBundlerBridgePlugin-defineNextStep',
      fn: () => {
        return false;
      }
    });

    compiler.hooks.done.tapAsync({
      name: 'dllBundlerBridgePlugin-endCycle',
      fn: (stats, cb) => {
        cb(null, stats);
      }
    });*/
  }

  buildEntryPaths(normalModuleFactory) {
    normalModuleFactory.hooks.factory.tap('NormalModuleFactory', () => (result, callback) => {
      const resolver = normalModuleFactory.hooks.resolver.call(null);

      // Ignored
      if (!resolver) return callback();

      resolver(result, (err, data) => {
        if (err) return callback(err);

        // Ignored
        if (!data) return callback();

        // direct module
        if (typeof data.source === 'function') return callback(null, data);

        normalModuleFactory.hooks.afterResolve.callAsync(data, (err, result) => {
          if (err) return callback(err);

          // Ignored
          if (!result) return callback();

          // Build NodeModulesEntryPaths
          if (!!this.nodeModulesEntryPaths[result.request]) {
            return callback();
          }

          const nodeModulesPath = fromRoot('./node_modules');

          if (!result.request.includes('loader')
            && result.request.includes(nodeModulesPath)) {
            // TODO: Improve the way we build relative path for result.request
            const relativeRequestPath = result.request.replace(`${fromRoot('.')}/`, '../../../');
            const normalizedRequestPath = path.normalize(relativeRequestPath);

            this.nodeModulesEntryPaths[normalizedRequestPath] = true;
          }

          let createdModule = normalModuleFactory.hooks.createModule.call(result);
          if (!createdModule) {
            if (!result.request) {
              return callback(new Error('Empty dependency (no request)'));
            }

            createdModule = new NormalModule(result);
          }

          createdModule = normalModuleFactory.hooks.module.call(createdModule, result);

          return callback(null, createdModule);
        });
      });
    });
  }

  sendEntryPaths() {
    if (this.compilerProcess && this.compilerProcess.send) {
      this.compilerProcess.send({
        type: 'dllEntryPaths',
        content: JSON.stringify(Object.keys(this.nodeModulesEntryPaths))
      });
    }
  }

  stopCompilerWhenNeeded() {
    process.on('exit', () => {
      this.compilerProcess.kill();
    });
  }
}
