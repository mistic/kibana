/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PublishingSubject, useReactiveVarFromSubject } from '../publishing_utils';

export interface PublishesDisabledActionIds {
  disabledActionIds: PublishingSubject<string[]>;
}

/**
 * A type guard which checks whether or not a given API publishes Disabled Action IDs.  This can be used
 * to programatically limit which actions are available on a per-API basis.
 */
export const apiPublishesDisabledActionIds = (
  unknownApi: null | unknown
): unknownApi is PublishesDisabledActionIds => {
  return Boolean(
    unknownApi && (unknownApi as PublishesDisabledActionIds)?.disabledActionIds !== undefined
  );
};

export const useDisabledActionIds = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesDisabledActionIds(api) ? api.disabledActionIds : undefined);
export const getDisabledActionIds = (api: null | unknown): string[] | undefined =>
  apiPublishesDisabledActionIds(api) ? api.disabledActionIds.getValue() : undefined;
