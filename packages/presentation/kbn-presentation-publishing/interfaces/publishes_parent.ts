/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PublishingSubject, useReactiveVarFromSubject } from '../publishing_utils';

export interface PublishesParent {
  parent: PublishingSubject<unknown>;
}

/**
 * A type guard which checks whether or not a given API publishes its parent API.
 */
export const apiPublishesParent = (unknownApi: null | unknown): unknownApi is PublishesParent => {
  return Boolean(unknownApi && (unknownApi as PublishesParent)?.parent !== undefined);
};

export const useParentFromApi = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesParent(api) ? api.parent : undefined);
export const getParentFromAPI = (api: null | unknown): unknown | null =>
  apiPublishesParent(api) ? api.parent.getValue() : null;
