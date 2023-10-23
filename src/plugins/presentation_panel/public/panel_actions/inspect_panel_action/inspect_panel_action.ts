/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { i18n } from '@kbn/i18n';
import { apiHasInspectorAdapters, HasInspectorAdapters } from '@kbn/inspector-plugin/public';
import { tracksOverlays } from '@kbn/presentation-containers';
import { getPanelTitle, getParentFromAPI } from '@kbn/presentation-publishing';
import { Action, IncompatibleActionError } from '@kbn/ui-actions-plugin/public';
import { inspector } from '../../kibana_services';
import { AnyApiActionContext } from '../types';

export const ACTION_INSPECT_PANEL = 'openInspector';

type InspectPanelActionApi = HasInspectorAdapters;
const isApiCompatible = (api: unknown | null): api is InspectPanelActionApi => {
  return apiHasInspectorAdapters(api);
};

export class InspectPanelAction implements Action<AnyApiActionContext> {
  public readonly type = ACTION_INSPECT_PANEL;
  public readonly id = ACTION_INSPECT_PANEL;
  public order = 20;

  constructor() {}

  public getDisplayName() {
    return i18n.translate('presentation.action.inspectPanel.displayName', {
      defaultMessage: 'Inspect',
    });
  }

  public getIconType() {
    return 'inspect';
  }

  public async isCompatible({ api }: AnyApiActionContext) {
    if (!isApiCompatible(api)) return false;
    return inspector.isAvailable(api.getInspectorAdapters());
  }

  public async execute({ api }: AnyApiActionContext) {
    if (!isApiCompatible(api)) throw new IncompatibleActionError();
    const adapters = api.getInspectorAdapters();

    if (!(await this.isCompatible({ api })) || adapters === undefined) {
      throw new IncompatibleActionError();
    }

    const panelTitle =
      getPanelTitle(api) ??
      i18n.translate('presentation.action.inspectPanel.untitledEmbeddableFilename', {
        defaultMessage: 'untitled',
      });
    const session = inspector.open(adapters, {
      title: panelTitle,
      options: {
        fileName: panelTitle,
      },
    });

    // send the overlay ref to the parent API if it is capable of tracking overlays
    const parent = getParentFromAPI(api);
    if (tracksOverlays(parent)) parent.openOverlay(session);
  }
}
