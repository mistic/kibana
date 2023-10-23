/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { TimeRange, Filter, Query } from '@kbn/es-query';
import { PublishingSubject, useReactiveVarFromSubject } from '../publishing_utils';

export interface PublishesLocalUnifiedSearch {
  localTimeRange: PublishingSubject<TimeRange | undefined>;
  localFilters: PublishingSubject<Filter[] | undefined>;
  localQuery: PublishingSubject<Query | undefined>;
}

export type PublishesWritableLocalUnifiedSearch = PublishesLocalUnifiedSearch & {
  setLocalTimeRange: (timeRange: TimeRange | undefined) => void;
  setLocalFilters: (filters: Filter[] | undefined) => void;
  setLocalQuery: (query: Query | undefined) => void;
};

export const apiPublishesLocalUnifiedSearch = (
  unknownApi: null | unknown
): unknownApi is PublishesLocalUnifiedSearch => {
  return Boolean(
    unknownApi &&
      (unknownApi as PublishesLocalUnifiedSearch)?.localTimeRange !== undefined &&
      (unknownApi as PublishesLocalUnifiedSearch)?.localFilters !== undefined &&
      (unknownApi as PublishesLocalUnifiedSearch)?.localQuery !== undefined
  );
};

export const apiPublishesWritableLocalUnifiedSearch = (
  unknownApi: null | unknown
): unknownApi is PublishesWritableLocalUnifiedSearch => {
  return (
    apiPublishesLocalUnifiedSearch(unknownApi) &&
    (unknownApi as PublishesWritableLocalUnifiedSearch).setLocalTimeRange !== undefined &&
    typeof (unknownApi as PublishesWritableLocalUnifiedSearch).setLocalTimeRange === 'function' &&
    (unknownApi as PublishesWritableLocalUnifiedSearch).setLocalFilters !== undefined &&
    typeof (unknownApi as PublishesWritableLocalUnifiedSearch).setLocalFilters === 'function' &&
    (unknownApi as PublishesWritableLocalUnifiedSearch).setLocalQuery !== undefined &&
    typeof (unknownApi as PublishesWritableLocalUnifiedSearch).setLocalQuery === 'function'
  );
};

export const useLocalTimeRange = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesLocalUnifiedSearch(api) ? api.localTimeRange : undefined);
export const getLocalTimeRange = (api: null | unknown) =>
  apiPublishesLocalUnifiedSearch(api) ? api.localTimeRange.getValue() : undefined;

export const useLocalFilters = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesLocalUnifiedSearch(api) ? api.localFilters : undefined);
export const getLocalFilters = (api: null | unknown) =>
  apiPublishesLocalUnifiedSearch(api) ? api.localFilters.getValue() : undefined;

export const useLocalQuery = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesLocalUnifiedSearch(api) ? api.localQuery : undefined);
export const getLocalQuery = (api: null | unknown) =>
  apiPublishesLocalUnifiedSearch(api) ? api.localQuery.getValue() : undefined;
