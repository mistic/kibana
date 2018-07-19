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

// tslint:disable max-classes-per-file
/* tslint:disable */

import { ChildProcess, fork } from 'child_process';
import * as Fs from 'fs';
import * as Path from 'path';
import signalExit from 'signal-exit';
import { promisify } from 'util';

import mkdirp from 'mkdirp';
import * as Rx from 'rxjs';
import { filter, first, map, takeUntil, tap } from 'rxjs/operators';
import webpack from 'webpack';
import RawModule from 'webpack/lib/RawModule';

// @ts-ignore
import { fromRoot } from '../../utils';

const mkdirpAsync = promisify(mkdirp);
const existsAsync = promisify(Fs.exists);
const writeFileAsync = promisify(Fs.writeFile);
const readFileAsync = promisify(Fs.readFile);
const realPathAsync = promisify(Fs.realpath);
const firstTrue = first(v => v === true);
const firstFalse = first(v => v === false);

const MANIFEST_NAME = 'KIBANA_VENDOR_DLL';
const MANIFEST_CONTEXT = fromRoot('.');
const DLL_ENTRY_STUB_MODULE_TYPE = 'javascript/dll-entry-stub';

function inNodeModules(path: string) {
  return path.includes(`${Path.sep}node_modules${Path.sep}`);
}

export class DynamicDllPlugin {
  private readonly isDevMode: boolean;
  private readonly entryPath: string;
  private readonly manifestPath: string;
  private readonly outputDir: string;
  private readonly outputJsFile: string;
  private readonly outputCssFile: string;
  private readonly webpackAliases: { [key: string]: string };
  private readonly webpackNoParseRules: RegExp[];
  private bundler?: ChildProcess;
  private bundlerOnline$ = new Rx.ReplaySubject(1);
  private bundlerMsg$ = new Rx.Subject();

  constructor(uiBundles: any) {
    this.isDevMode = uiBundles.isDevMode();
    this.entryPath = uiBundles.resolvePath('vendor.entry.dll.js');
    this.manifestPath = uiBundles.resolvePath('vendor.manifest.dll.json');
    this.outputDir = uiBundles.resolvePath();
    this.outputJsFile = 'vendor.bundle.dll.js';
    this.outputCssFile = 'vendor.styles.dll.css';
    this.webpackAliases = uiBundles.getAliases();
    this.webpackNoParseRules = uiBundles.getWebpackNoParseRules();
  }

  public apply(compiler: webpack.Compiler) {
    this.bindToCompiler(compiler);

    /**
     * Apply the DllReferencePlugin after our beforeCompile hook
     * is registered so we can ensure a stub manifest exists before
     * DLLReferencePlugin tries to read it
     */
    new webpack.DllReferencePlugin({
      context: MANIFEST_CONTEXT,
      manifest: this.manifestPath,
    }).apply(compiler);
  }

  private async readCurrentManifest() {
    return JSON.parse(await readFileAsync(this.manifestPath, 'utf8'));
  }

  private async ensureManifestExists() {
    const exists = await existsAsync(this.manifestPath);
    if (!exists) {
      await mkdirpAsync(Path.dirname(this.manifestPath));
      await writeFileAsync(
        this.manifestPath,
        JSON.stringify({
          name: MANIFEST_NAME,
          content: {},
        }),
        'utf8'
      );
    }
  }

  private async ensureEntryExists() {
    const exists = await existsAsync(this.entryPath);
    if (!exists) {
      await mkdirpAsync(Path.dirname(this.entryPath));
      await writeFileAsync(this.entryPath, '', 'utf8');
    }
  }

  private startBundler(isWatchMode: boolean) {
    return fork(require.resolve('./dll_bundler_worker'), [], {
      execArgv: ['-r', require.resolve('../../setup_node_env')],
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      env: {
        WEBPACK_MODE: this.isDevMode ? 'development' : 'production',
        ENTRY_PATH: this.entryPath,
        OUTPUT_DIR: this.outputDir,
        OUTPUT_JS_FILE: this.outputJsFile,
        OUTPUT_CSS_FILE: this.outputCssFile,
        MANIFEST_PATH: this.manifestPath,
        WATCH_MODE: isWatchMode ? 'true' : '',
        MANIFEST_NAME,
        MANIFEST_CONTEXT,
        WEBPACK_ALIASES_JSON: JSON.stringify(this.webpackAliases),
        WEBPACK_NO_PARSE_JSON: JSON.stringify(this.webpackNoParseRules.map(re => re.source)),
      },
    });
  }

  private getOrInitBundler() {
    if (this.bundler) {
      return this.bundler;
    }

    this.bundler = this.startBundler(true);

    Rx.fromEvent<any>(this.bundler, 'message')
      .pipe(map(([msg]) => msg), takeUntil(this.bundlerOnline$.pipe(firstFalse)))
      .subscribe({
        next: msg => {
          if (msg && msg.type) {
            console.log({
              ...msg,
              entryFile:
                typeof msg.entryFile === 'string'
                  ? `${msg.entryFile.length} length`
                  : msg.entryFile,
            });
            this.bundlerMsg$.next(msg);

            if (msg.type === 'online') {
              this.bundlerOnline$.next(true);
            }
          } else {
            console.log('invalid bundle message', msg);
          }
        },
        error: error => {
          throw error;
        },
      });

    const removeOnExit = signalExit(() => {
      if (this.bundler) {
        this.bundler.kill('SIGKILL');
      }
    });

    this.bundler.once('exit', (code?: number) => {
      removeOnExit();
      this.bundlerOnline$.next(false);
      this.bundler = undefined;
      throw new Error(`dll bundler exitted with code ${code}`);
    });

    return this.bundler;
  }

  private async waitForComplete(entryFile: string) {
    const bundler = this.getOrInitBundler();

    console.log('waiting for bundler to be online');
    await this.bundlerOnline$.pipe(firstTrue).toPromise();

    console.log('querying bundler about its status');
    bundler.send({ type: 'getStatus', entryFile });

    const resp = await this.bundlerMsg$
      .pipe(first(msg => msg.type === 'status' && msg.entryFile === entryFile && msg.result))
      .toPromise();

    console.log('bundler says it completed the last entry file:', resp.result);

    if (resp.result === 'failure') {
      throw new Error(`Optimization failure:\n  ${resp.details.split('\n').join('\n  ')}`);
    }
  }

  private bindToCompiler(compiler: webpack.Compiler) {
    let waitForBundlerEntryFile: string | undefined;

    compiler.hooks.run.tapPromise('DynamicDllPlugin', async () => {
      console.log('starting compile');
      await this.ensureManifestExists();
      await this.ensureEntryExists();
    });

    compiler.hooks.watchRun.tapPromise('DynamicDllPlugin', async () => {
      console.log('starting watch compile');
      await this.ensureManifestExists();
      await this.ensureEntryExists();
      await this.getOrInitBundler();
    });

    /**
     * hook into the normalModuleFactory to find modules that are pointing
     * to node_modules, and stub out DLL manifest if it isn't already created
     */
    compiler.hooks.beforeCompile.tapPromise('DynamicDllPlugin', async ({ normalModuleFactory }) => {
      if (waitForBundlerEntryFile) {
        console.log('waiting for dll bundler');
        await this.waitForComplete(waitForBundlerEntryFile);
        waitForBundlerEntryFile = undefined;
      }

      const manifest = await this.readCurrentManifest();

      normalModuleFactory.hooks.factory.tap(
        'NormalModuleFactory',
        (actualFactory: any) => (params, cb) => {
          actualFactory(params, (error, module) => {
            if (error || !module) {
              cb(error, module);
            } else {
              this.mapNormalModule(module, manifest).then(
                (m = module) => cb(undefined, m),
                error => cb(error)
              );
            }
          });
        }
      );
    });

    compiler.hooks.compilation.tap('DynamicDllPlugin', compilation => {
      if (compilation.compiler !== compiler) {
        // ignore child compilations from plugins like mini-css-extract-plugin
      }

      compilation.hooks.needAdditionalPass.tap('DynamicDllPlugin', () => {
        const stubs = compilation.modules.filter(m => m.type === DLL_ENTRY_STUB_MODULE_TYPE);

        if (!stubs.length) {
          return false;
        }

        debugger;
        console.log('... need additional pass, dll missing', stubs.map(m => m.resource));
        return true;
      });
    });

    compiler.hooks.done.tapPromise('DynamicDllPlugin', async stats => {
      const requires = [];

      let relativeRoot = Path.relative(this.outputDir, MANIFEST_CONTEXT);
      if (!relativeRoot.startsWith('.')) {
        relativeRoot = `./${relativeRoot}`;
      }

      for (const module of stats.compilation.modules) {
        // re-include requires for modules already handled by the dll
        if (module.delegateData) {
          const absoluteResource = Path.resolve(MANIFEST_CONTEXT, module.request);
          requires.push(`require('${Path.relative(this.outputDir, absoluteResource)}');`);
        }

        // include requires for modules that need to be added to the dll
        if (module.type === DLL_ENTRY_STUB_MODULE_TYPE) {
          requires.push(`require('${Path.relative(this.outputDir, module.resource)}');`);
        }
      }

      const newContent = requires.sort().join('\n');
      const exitingContent = await readFileAsync(this.entryPath, 'utf8');
      if (exitingContent !== newContent) {
        console.log('writing new bundler entry file');
        await writeFileAsync(this.entryPath, newContent);
        waitForBundlerEntryFile = newContent;
      }

      for (const [key, module] of Object.entries(stats.compilation.cache)) {
        if (module.type === DLL_ENTRY_STUB_MODULE_TYPE) {
          delete stats.compilation.cache[key];
        }
      }
    });
  }

  private async mapNormalModule(module: any, manifest: { content: { [path: string]: any } }) {
    // ignore anything that doesn't have a resource (ignored) or is already delegating to the DLL
    if (!module.resource || module.delegateData) {
      return;
    }

    // ignore anything that needs special loaders or config
    if (module.request.includes('!') || module.request.includes('?')) {
      return;
    }

    // ignore files that are not in node_modules
    if (!inNodeModules(module.resource)) {
      return;
    }

    // also ignore files that are symlinked into node_modules, but only
    // do the `realpath` call after checking the plain resource path
    if (!inNodeModules(await realPathAsync(module.resource))) {
      return;
    }

    const dirs = module.resource.split(Path.sep);
    const nodeModuleName = dirs[dirs.lastIndexOf('node_modules') + 1];

    // ignore webpack loader modules
    if (nodeModuleName.endsWith('-loader')) {
      return;
    }

    const stubModule = new RawModule(
      `/* pending dll entry */`,
      `dll pending:${module.resource}`,
      module.resource
    );
    stubModule.type = DLL_ENTRY_STUB_MODULE_TYPE;
    stubModule.resource = module.resource;
    return stubModule;
  }
}
