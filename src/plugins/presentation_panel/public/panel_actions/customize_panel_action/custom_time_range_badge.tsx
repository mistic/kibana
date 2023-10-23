/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PrettyDuration } from '@elastic/eui';
import { Action, FrequentCompatibilityChangeAction } from '@kbn/ui-actions-plugin/public';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { UI_SETTINGS } from '@kbn/data-plugin/common';
import { apiPublishesLocalUnifiedSearch, getLocalTimeRange } from '@kbn/presentation-publishing';
import { core } from '../../kibana_services';
import { AnyApiActionContext } from '../types';
import { CustomizePanelAction } from './customize_panel_action';

export const CUSTOM_TIME_RANGE_BADGE = 'CUSTOM_TIME_RANGE_BADGE';

export class CustomTimeRangeBadge
  extends CustomizePanelAction
  implements Action<AnyApiActionContext>, FrequentCompatibilityChangeAction<AnyApiActionContext>
{
  public readonly type = CUSTOM_TIME_RANGE_BADGE;
  public readonly id = CUSTOM_TIME_RANGE_BADGE;
  public order = 7;

  public getDisplayName({ api }: AnyApiActionContext) {
    const timeRange = getLocalTimeRange(api);
    if (!timeRange) return '';
    return renderToString(
      <PrettyDuration
        timeTo={timeRange.to}
        timeFrom={timeRange.from}
        dateFormat={core.uiSettings.get<string>(UI_SETTINGS.DATE_FORMAT) ?? 'Browser'}
      />
    );
  }

  public couldBecomeCompatible({ api }: AnyApiActionContext) {
    return apiPublishesLocalUnifiedSearch(api);
  }

  public subscribeToCompatibilityChanges(
    { api }: AnyApiActionContext,
    onChange: (isCompatible: boolean, action: CustomTimeRangeBadge) => void
  ) {
    if (!apiPublishesLocalUnifiedSearch(api)) return;
    return api.localTimeRange.subscribe((localTimeRange) =>
      onChange(Boolean(localTimeRange), this)
    );
  }

  public getIconType() {
    return 'calendar';
  }

  public async isCompatible({ api }: AnyApiActionContext) {
    const timeRange = getLocalTimeRange(api);
    return Boolean(timeRange);
  }
}
