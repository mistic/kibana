/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { i18n } from '@kbn/i18n';
import { createKibanaReactContext } from '@kbn/kibana-react-plugin/public';
import { toMountPoint } from '@kbn/react-kibana-mount';
import { Action, IncompatibleActionError } from '@kbn/ui-actions-plugin/public';
import React from 'react';

import { tracksOverlays } from '@kbn/presentation-containers';
import {
  apiPublishesLocalUnifiedSearch,
  apiPublishesViewMode,
  getParentFromAPI,
  getViewMode,
  PublishesViewMode,
  PublishesWritableLocalUnifiedSearch,
  PublishesWritablePanelDescription,
  PublishesWritablePanelTitle,
} from '@kbn/presentation-publishing';
import { core } from '../../kibana_services';
import { EditPanelAction } from '../edit_panel_action/edit_panel_action';
import { AnyApiActionContext } from '../types';
import { CustomizePanelEditor } from './customize_panel_editor';

export const ACTION_CUSTOMIZE_PANEL = 'ACTION_CUSTOMIZE_PANEL';

export type CustomizePanelActionApi = PublishesViewMode &
  Partial<PublishesWritableLocalUnifiedSearch> &
  Partial<PublishesWritablePanelDescription> &
  Partial<PublishesWritablePanelTitle>;

const isApiCompatible = (api: unknown | null): api is CustomizePanelActionApi => {
  return Boolean(apiPublishesViewMode(api));
};

export class CustomizePanelAction implements Action<AnyApiActionContext> {
  public type = ACTION_CUSTOMIZE_PANEL;
  public id = ACTION_CUSTOMIZE_PANEL;
  public order = 40;

  constructor(protected readonly editPanel: EditPanelAction) {}

  public getDisplayName({ api }: AnyApiActionContext): string {
    return i18n.translate('presentation.action.customizePanel.displayName', {
      defaultMessage: 'Panel settings',
    });
  }

  public getIconType() {
    return 'gear';
  }

  public async isCompatible({ api }: AnyApiActionContext) {
    if (!isApiCompatible(api)) return false;
    // It should be possible to customize just the time range in View mode
    return getViewMode(api) === 'edit' || apiPublishesLocalUnifiedSearch(api);
  }

  public async execute({ api }: AnyApiActionContext) {
    if (!isApiCompatible(api)) throw new IncompatibleActionError();

    // send the overlay ref to the parent if it is capable of tracking overlays
    const parent = getParentFromAPI(api);
    const overlayTracker = tracksOverlays(parent) ? parent : undefined;

    const { Provider: KibanaReactContextProvider } = createKibanaReactContext({
      uiSettings: core.uiSettings,
    });

    const handle = core.overlays.openFlyout(
      toMountPoint(
        <KibanaReactContextProvider>
          <CustomizePanelEditor
            api={api}
            editPanelAction={this.editPanel}
            onClose={() => {
              if (overlayTracker) overlayTracker.clearOverlays();
              handle.close();
            }}
          />
        </KibanaReactContextProvider>,
        { theme: core.theme, i18n: core.i18n }
      ),
      {
        size: 's',
        'data-test-subj': 'customizePanel',
        onClose: (overlayRef) => {
          if (overlayTracker) overlayTracker.clearOverlays();
          overlayRef.close();
        },
        maxWidth: true,
      }
    );
    overlayTracker?.openOverlay(handle);
  }
}
