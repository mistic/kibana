/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PublishingSubject, useReactiveVarFromSubject } from '../publishing_utils';

export type ViewMode = 'view' | 'edit' | 'print';
export const defaultViewMode: ViewMode = 'view';

export interface PublishesViewMode {
  viewMode: PublishingSubject<ViewMode>;
}

export type PublishesWritableViewMode = PublishesViewMode & {
  setViewMode: (viewMode: ViewMode) => void;
};

export const apiPublishesViewMode = (
  unknownApi: null | unknown
): unknownApi is PublishesViewMode => {
  return Boolean(unknownApi && (unknownApi as PublishesViewMode)?.viewMode !== undefined);
};

export const apiPublishesWritableViewMode = (
  unknownApi: null | unknown
): unknownApi is PublishesWritableViewMode => {
  return (
    apiPublishesViewMode(unknownApi) &&
    (unknownApi as PublishesWritableViewMode).setViewMode !== undefined &&
    typeof (unknownApi as PublishesWritableViewMode).setViewMode === 'function'
  );
};

export const useViewMode = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesViewMode(api) ? api.viewMode : undefined, defaultViewMode);
export const getViewMode = (api: null | unknown) => {
  return apiPublishesViewMode(api) ? api.viewMode.getValue() : defaultViewMode;
};
