/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { i18n } from '@kbn/i18n';

import {
  apiPublishesViewMode,
  getViewMode,
  hasEditCapabilities,
  HasEditCapabilities,
  PublishesViewMode,
} from '@kbn/presentation-publishing';
import {
  Action,
  FrequentCompatibilityChangeAction,
  IncompatibleActionError,
} from '@kbn/ui-actions-plugin/public';
import { AnyApiActionContext } from '../types';

export const ACTION_EDIT_PANEL = 'editPanel';

type EditPanelActionApi = PublishesViewMode & HasEditCapabilities;

const isApiCompatible = (api: unknown | null): api is EditPanelActionApi => {
  return Boolean(hasEditCapabilities(api) && apiPublishesViewMode(api));
};

export class EditPanelAction
  implements Action<AnyApiActionContext>, FrequentCompatibilityChangeAction<AnyApiActionContext>
{
  public readonly type = ACTION_EDIT_PANEL;
  public readonly id = ACTION_EDIT_PANEL;
  public order = 50;

  constructor() {}

  public getDisplayName({ api }: AnyApiActionContext) {
    if (!isApiCompatible(api)) throw new IncompatibleActionError();
    return i18n.translate('presentation.action.editPanel.displayName', {
      defaultMessage: 'Edit {value}',
      values: {
        value: api.getTypeDisplayName(),
      },
    });
  }

  public subscribeToCompatibilityChanges(
    { api }: AnyApiActionContext,
    onChange: (isCompatible: boolean, action: Action<AnyApiActionContext>) => void
  ) {
    if (!isApiCompatible(api)) return;
    return api.viewMode.subscribe((viewMode) => {
      if (viewMode === 'edit' && isApiCompatible(api) && api.isEditingEnabled()) {
        onChange(true, this);
        return;
      }
      onChange(false, this);
    });
  }

  public couldBecomeCompatible({ api }: AnyApiActionContext) {
    return isApiCompatible(api);
  }

  public getIconType() {
    return 'pencil';
  }

  public async isCompatible({ api }: AnyApiActionContext) {
    if (!isApiCompatible(api) || !api.isEditingEnabled()) return false;
    return getViewMode(api) === 'edit';
  }

  public async execute({ api }: AnyApiActionContext) {
    if (!isApiCompatible(api)) throw new IncompatibleActionError();
  }
}
