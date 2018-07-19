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

import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as Fs from 'fs';

import { PUBLIC_PATH_PLACEHOLDER } from '../public_path_placeholder';

const {
  WEBPACK_MODE,
  OUTPUT_DIR,
  OUTPUT_JS_FILE,
  OUTPUT_CSS_FILE,
  ENTRY_PATH,
  MANIFEST_PATH,
  WATCH_MODE,
  MANIFEST_NAME,
  MANIFEST_CONTEXT,
  WEBPACK_ALIASES_JSON,
  WEBPACK_NO_PARSE_JSON,
} = process.env;

const compiler = webpack({
  mode: WEBPACK_MODE,
  entry: [ENTRY_PATH],
  context: MANIFEST_CONTEXT,
  output: {
    filename: OUTPUT_JS_FILE,
    path: OUTPUT_DIR,
    publicPath: PUBLIC_PATH_PLACEHOLDER,
    library: MANIFEST_NAME,
  },
  node: {
    fs: 'empty',
    child_process: 'empty',
    dns: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    extensions: ['.js', '.json'],
    mainFields: ['browser', 'browserify', 'main'],
    alias: JSON.parse(WEBPACK_ALIASES_JSON)
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.png$/,
        loader: 'url-loader'
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg|ico)(\?|$)/,
        loader: 'file-loader'
      },
    ],
    noParse: JSON.parse(WEBPACK_NO_PARSE_JSON).map(reSource => new RegExp(reSource))
  },
  plugins: [
    new webpack.DllPlugin({
      context: MANIFEST_CONTEXT,
      name: MANIFEST_NAME,
      path: MANIFEST_PATH,
    }),
    new MiniCssExtractPlugin({
      filename: OUTPUT_CSS_FILE,
    })
  ],
});

const history = [];
process.send({ type: 'online' });
process.on('message', (msg) => {
  if (msg && msg.type === 'getStatus') {
    const status = history.find(h => h.entryFile === msg.entryFile);

    if (!status) {
      console.log('dll bundler: no status found');
    } else {
      console.log('dll bundler: found status', status.result);
    }

    process.send(
      status || { type: 'status', entryFile: msg.entryFile }
    );
  } else {
    console.log('bundler received invalid message', msg);
  }
});


const onRun = () => {
  history.unshift({
    type: 'status',
    entryFile: Fs.readFileSync(ENTRY_PATH, 'utf8')
  });

  console.log('dll bundler: run');

  process.send(history[0]);
};

const consumeStats = stats => {
  if (stats.hasErrors() || stats.hasWarnings()) {
    console.log('dll bundler: failure');
    history[0].result = 'failure';
    history[0].details = stats.toString({
      ...webpack.Stats.presetToOptions('minimal'),
      colors: true
    });
  } else {
    console.log('dll bundler: success');
    history[0].result = 'success';
  }

  process.send({ type: 'status', ...history[0] });
};

const onFatalError = error => {
  console.log('dll bundler: fatal');
  console.log(`\nFATAL ERROR: ${error.stack}\n`);
  process.exit(1);
};

compiler.hooks.run.tap('DllBundler', onRun);
compiler.hooks.watchRun.tap('DllBundler', onRun);
compiler.hooks.done.tap('DllBundler', consumeStats);

if (WATCH_MODE) {
  compiler.watch({}, (error, stats) => {
    if (error && stats) {
      consumeStats(stats);
    } else if (error) {
      onFatalError(error);
    }
  });
} else {
  compiler.run((error) => {
    if (error) {
      onFatalError(error);
    }
  });
}
