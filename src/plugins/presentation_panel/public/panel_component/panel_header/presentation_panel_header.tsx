/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiScreenReaderOnly } from '@elastic/eui';
import {
  apiPublishesParent,
  useHidePanelTitle,
  usePanelDescription,
  usePanelTitle,
  useViewMode,
} from '@kbn/presentation-publishing';
import classNames from 'classnames';
import React from 'react';
import { getAriaLabelForTitle } from '../presentation_panel_strings';
import { PresentationPanelInternalProps } from '../types';
import { PresentationPanelContextMenu } from './presentation_panel_context_menu';
import { PresentationPanelTitle } from './presentation_panel_title';
import { usePresentationPanelHeaderActions } from './use_presentation_panel_header_actions';

export const PresentationPanelHeader = ({
  api,
  index,
  headerId,
  getActions,
  actionPredicate,
  showBadges = true,
  showNotifications = true,
}: {
  api: unknown;
  headerId: string;
  index: PresentationPanelInternalProps['index'];
  showBadges: PresentationPanelInternalProps['showBadges'];
  getActions: PresentationPanelInternalProps['getActions'];
  actionPredicate: PresentationPanelInternalProps['actionPredicate'];
  showNotifications: PresentationPanelInternalProps['showNotifications'];
}) => {
  const { notificationElements, badgeElements } = usePresentationPanelHeaderActions(
    showNotifications,
    showBadges,
    api,
    getActions
  );

  const viewMode = useViewMode(api);
  const panelTitle = usePanelTitle(api);
  const panelDescription = usePanelDescription(api);

  const hidePanelTitle = useHidePanelTitle(api);
  const parentHidePanelTitle = useHidePanelTitle(apiPublishesParent(api) ? api.parent : undefined);

  const hideTitle =
    Boolean(hidePanelTitle) ||
    Boolean(parentHidePanelTitle) ||
    (viewMode === 'view' && !Boolean(panelTitle));

  const showPanelBar =
    !hideTitle ||
    panelDescription ||
    viewMode !== 'view' ||
    badgeElements.length > 0 ||
    notificationElements.length > 0;

  const ariaLabel = getAriaLabelForTitle(showPanelBar ? panelTitle : undefined);
  const ariaLabelElement = (
    <EuiScreenReaderOnly>
      <span id={headerId}>{ariaLabel}</span>
    </EuiScreenReaderOnly>
  );

  const headerClasses = classNames('presentationPanel__header', {
    'presentationPanel__header--floater': !showPanelBar,
  });

  const titleClasses = classNames('presentationPanel__title', {
    'presentationPanel--dragHandle': viewMode === 'edit',
  });

  const contextMenuElement = (
    <PresentationPanelContextMenu {...{ index, api, getActions, actionPredicate }} />
  );

  if (!showPanelBar) {
    return (
      <div className={headerClasses}>
        {contextMenuElement}
        {ariaLabelElement}
      </div>
    );
  }

  return (
    <figcaption
      className={headerClasses}
      data-test-subj={`presentationPanelHeading-${(panelTitle || '').replace(/\s/g, '')}`}
    >
      <h2 data-test-subj="dashboardPanelTitle" className={titleClasses}>
        {ariaLabelElement}
        <PresentationPanelTitle viewMode={viewMode} hideTitle={hideTitle} api={api} />
        {showBadges && badgeElements}
      </h2>
      {showNotifications && notificationElements}
      {contextMenuElement}
    </figcaption>
  );
};
