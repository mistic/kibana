/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PublishingSubject, useReactiveVarFromSubject } from '../publishing_utils';

export interface PublishesDataLoading {
  dataLoading: PublishingSubject<boolean>;
}

export const apiPublishesDataLoading = (
  unknownApi: null | unknown
): unknownApi is PublishesDataLoading => {
  return Boolean(unknownApi && (unknownApi as PublishesDataLoading)?.dataLoading !== undefined);
};

export const useDataLoading = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesDataLoading(api) ? api.dataLoading : undefined);
export const getDataLoading = (api: null | unknown) =>
  apiPublishesDataLoading(api) ? api.dataLoading.getValue() : undefined;
