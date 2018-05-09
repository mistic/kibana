import { pick } from '../../../utils';

/**
 * @param {string} field
 * @returns {string}
 */
const normalizeHeaderField = field => field.trim().toLowerCase();

/**
 * @param {Object<string, string | string[] | undefined>} headers
 * @param {string[]} fieldsToKeep
 * @returns {Object<string, string | string[] | undefined>}
 */
export function filterHeaders(headers, fieldsToKeep) {
  // Normalize list of headers we want to allow in upstream request
  const fieldsToKeepNormalized = fieldsToKeep.map(normalizeHeaderField);

  return pick(headers, fieldsToKeepNormalized);
}
