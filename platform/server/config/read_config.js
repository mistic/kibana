import { readFileSync } from 'fs';
import { safeLoad } from 'js-yaml';

import { ensureDeepObject } from './ensure_deep_object';

const readYaml = path => safeLoad(readFileSync(path, 'utf8'));

export const getConfigFromFile = configFile => {
  const yaml = readYaml(configFile);
  return yaml == null ? yaml : ensureDeepObject(yaml);
};
