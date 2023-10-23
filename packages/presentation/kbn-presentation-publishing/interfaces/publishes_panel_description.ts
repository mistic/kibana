/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PublishingSubject, useReactiveVarFromSubject } from '../publishing_utils';

export interface PublishesPanelDescription {
  panelDescription: PublishingSubject<string | undefined>;
  defaultPanelDescription?: PublishingSubject<string | undefined>;
}

export type PublishesWritablePanelDescription = PublishesPanelDescription & {
  setPanelDescription: (newTitle: string | undefined) => void;
};

export const apiPublishesPanelDescription = (
  unknownApi: null | unknown
): unknownApi is PublishesPanelDescription => {
  return Boolean(
    unknownApi && (unknownApi as PublishesPanelDescription)?.panelDescription !== undefined
  );
};

export const apiPublishesWritablePanelDescription = (
  unknownApi: null | unknown
): unknownApi is PublishesWritablePanelDescription => {
  return (
    apiPublishesPanelDescription(unknownApi) &&
    (unknownApi as PublishesWritablePanelDescription).setPanelDescription !== undefined &&
    typeof (unknownApi as PublishesWritablePanelDescription).setPanelDescription === 'function'
  );
};

export const usePanelDescription = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesPanelDescription(api) ? api.panelDescription : undefined);
export const getPanelDescription = (api: null | unknown) =>
  apiPublishesPanelDescription(api) ? api.panelDescription.getValue() : undefined;

export const useDefaultPanelDescription = (api: null | unknown) =>
  useReactiveVarFromSubject(
    apiPublishesPanelDescription(api) ? api.defaultPanelDescription : undefined
  );
export const getDefaultPanelDescription = (api: null | unknown) =>
  apiPublishesPanelDescription(api) ? api.defaultPanelDescription?.getValue() : undefined;
