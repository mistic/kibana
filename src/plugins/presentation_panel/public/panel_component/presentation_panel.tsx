/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiFlexGroup, EuiPanel, htmlIdGenerator } from '@elastic/eui';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';

import { getId, useDataLoading, useFatalError, useViewMode } from '@kbn/presentation-publishing';
import { PresentationPanelInternalProps } from './types';
import { PresentationPanelHeader } from './panel_header/presentation_panel_header';
import { PresentationPanelError } from './presentation_panel_error';

export const PresentationPanelInternal = <
  ApiType extends unknown = unknown,
  PropsType extends {} = {}
>({
  index,
  hideHeader,
  showShadow,

  showBadges,
  showNotifications,
  getActions,
  actionPredicate,

  Component,
  componentProps,

  onPanelStatusChange,
}: PresentationPanelInternalProps<ApiType, PropsType>) => {
  const [api, setApi] = useState<ApiType | null>(null);

  const headerId = useMemo(() => htmlIdGenerator()(), []);
  const id = getId(api);

  const loading = useDataLoading(api);
  const viewMode = useViewMode(api);
  const fatalError = useFatalError(api);

  // TODO: subscribe to status changes and call onPanelStatusChange?

  const classes = useMemo(
    () =>
      classNames('presentationPanel', {
        'presentationPanel--editing': viewMode !== 'view',
        'presentationPanel--loading': loading,
      }),
    [viewMode, loading]
  );

  const contentAttrs = useMemo(() => {
    const attrs: { [key: string]: boolean } = {};
    if (loading) attrs['data-loading'] = true;
    if (fatalError) attrs['data-error'] = true;
    return attrs;
  }, [loading, fatalError]);

  return (
    <EuiPanel
      role="figure"
      paddingSize="none"
      className={classes}
      hasShadow={showShadow}
      aria-labelledby={headerId}
      data-test-embeddable-id={id}
      data-test-subj="embeddablePanel"
    >
      {!hideHeader && (
        <PresentationPanelHeader
          api={api}
          headerId={headerId}
          index={index}
          showBadges={showBadges}
          showNotifications={showNotifications}
          getActions={getActions}
          actionPredicate={actionPredicate}
        />
      )}
      {fatalError && (
        <EuiFlexGroup
          alignItems="center"
          className="eui-fullHeight presentationPanel__error"
          data-test-subj="presentationPanelError"
          justifyContent="center"
        >
          <PresentationPanelError api={api} error={fatalError} />
        </EuiFlexGroup>
      )}
      <div className="presentationPanel__content" {...contentAttrs}>
        <Component
          {...(componentProps as React.ComponentProps<typeof Component>)}
          ref={(newApi) => {
            if (newApi && !api) setApi(newApi);
          }}
        />
      </div>
    </EuiPanel>
  );
};
