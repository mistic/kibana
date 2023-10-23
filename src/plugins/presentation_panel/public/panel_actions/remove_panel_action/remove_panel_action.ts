/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { i18n } from '@kbn/i18n';
import { getId, getViewMode, HasId, PublishesViewMode } from '@kbn/presentation-publishing';
import { Action, IncompatibleActionError } from '@kbn/ui-actions-plugin/public';

import { getContainerParentFromAPI, PresentationContainer } from '@kbn/presentation-containers';
import { AnyApiActionContext } from '../types';

export const REMOVE_PANEL_ACTION = 'deletePanel';

type RemovePanelActionApi = PublishesViewMode & HasId & { parent: PresentationContainer };

const isApiCompatible = (api: unknown | null): api is RemovePanelActionApi => {
  const id = getId(api);
  const viewMode = getViewMode(api);
  const parent = getContainerParentFromAPI(api);
  return Boolean(id && viewMode && parent);
};

export class RemovePanelAction implements Action<AnyApiActionContext> {
  public readonly type = REMOVE_PANEL_ACTION;
  public readonly id = REMOVE_PANEL_ACTION;
  public order = 1;

  constructor() {}

  public getDisplayName() {
    return i18n.translate('presentation.action.removePanel.displayName', {
      defaultMessage: 'Delete from dashboard',
    });
  }

  public getIconType() {
    return 'trash';
  }

  public async isCompatible({ api }: AnyApiActionContext) {
    if (!isApiCompatible(api)) return false;

    // any parent can disallow panel removal by implementing canRemovePanels. If this method
    // is not implemented, panel removal is always allowed.
    const parentAllowsPanelRemoval = api.parent.canRemovePanels?.() ?? true;
    return Boolean(getViewMode(api) === 'edit' && parentAllowsPanelRemoval);
  }

  public async execute({ api }: AnyApiActionContext) {
    if (!isApiCompatible(api)) throw new IncompatibleActionError();
    api.parent?.removePanel(api.id);
  }
}
