/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PublishingSubject, useReactiveVarFromSubject } from '../publishing_utils';

export interface PublishesPanelTitle {
  panelTitle: PublishingSubject<string | undefined>;
  hidePanelTitle: PublishingSubject<boolean | undefined>;
  defaultPanelTitle?: PublishingSubject<string | undefined>;
}

export type PublishesWritablePanelTitle = PublishesPanelTitle & {
  setPanelTitle: (newTitle: string | undefined) => void;
  setHidePanelTitle: (hide: boolean | undefined) => void;
  setDefaultPanelTitle?: (newDefaultTitle: string | undefined) => void;
};

export const apiPublishesPanelTitle = (
  unknownApi: null | unknown
): unknownApi is PublishesPanelTitle => {
  return Boolean(
    unknownApi &&
      (unknownApi as PublishesPanelTitle)?.panelTitle !== undefined &&
      (unknownApi as PublishesPanelTitle)?.hidePanelTitle !== undefined
  );
};

export const apiPublishesWritablePanelTitle = (
  unknownApi: null | unknown
): unknownApi is PublishesWritablePanelTitle => {
  return (
    apiPublishesPanelTitle(unknownApi) &&
    (unknownApi as PublishesWritablePanelTitle).setPanelTitle !== undefined &&
    (typeof (unknownApi as PublishesWritablePanelTitle).setPanelTitle === 'function' &&
      (unknownApi as PublishesWritablePanelTitle).setHidePanelTitle) !== undefined &&
    typeof (unknownApi as PublishesWritablePanelTitle).setHidePanelTitle === 'function'
  );
};

export const usePanelTitle = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesPanelTitle(api) ? api.panelTitle : undefined);
export const getPanelTitle = (api: null | unknown) =>
  apiPublishesPanelTitle(api) ? api.panelTitle.getValue() : undefined;

export const useHidePanelTitle = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesPanelTitle(api) ? api.hidePanelTitle : undefined);
export const getHidePanelTitle = (api: null | unknown) =>
  apiPublishesPanelTitle(api) ? api.hidePanelTitle.getValue() : undefined;

export const useDefaultPanelTitle = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesPanelTitle(api) ? api.defaultPanelTitle : undefined);
export const getDefaultPanelTitle = (api: null | unknown) =>
  apiPublishesPanelTitle(api) ? api.defaultPanelTitle?.getValue() : undefined;
