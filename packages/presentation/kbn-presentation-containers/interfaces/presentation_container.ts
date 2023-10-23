/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { apiPublishesParent } from '@kbn/presentation-publishing';

export interface PresentationContainer {
  removePanel: (panelId: string) => void;
  canRemovePanels?: () => boolean;
  addPanel: () => void;
}

export const apiIsPresentationContainer = (
  unknownApi: unknown | null
): unknownApi is PresentationContainer => {
  return (
    Boolean((unknownApi as PresentationContainer)?.removePanel !== undefined) &&
    Boolean((unknownApi as PresentationContainer)?.addPanel !== undefined)
  );
};

export const getContainerParentFromAPI = (
  api: null | unknown
): PresentationContainer | undefined => {
  const apiParent = apiPublishesParent(api) ? api.parent.getValue() : null;
  if (!apiParent) return undefined;
  return apiIsPresentationContainer(apiParent) ? apiParent : undefined;
};
