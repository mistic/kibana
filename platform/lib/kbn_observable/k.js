import { pipeFromArray } from './lib';
import { $from } from './factories';

export function k$(source) {
  return (...operations) => pipeFromArray(operations)($from(source));
}
