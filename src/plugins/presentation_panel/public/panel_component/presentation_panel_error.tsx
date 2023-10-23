/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiButtonEmpty, EuiEmptyPrompt, EuiText } from '@elastic/eui';
import React, { useEffect, useMemo, useState } from 'react';

import { ErrorLike } from '@kbn/expressions-plugin/common';
import { Markdown } from '@kbn/kibana-react-plugin/public';

import { usePanelTitle } from '@kbn/presentation-publishing';
import { Subscription } from 'rxjs';
import { editPanelAction } from '../panel_actions/panel_actions';
import { getErrorCallToAction } from './presentation_panel_strings';

interface EmbeddablePanelErrorProps {
  error: ErrorLike;
  api: unknown;
}

export const PresentationPanelError = ({ api, error }: EmbeddablePanelErrorProps) => {
  const [isEditable, setIsEditable] = useState(false);
  const handleErrorClick = useMemo(
    () => (isEditable ? () => editPanelAction.execute({ api }) : undefined),
    [api, isEditable]
  );
  const label = useMemo(() => editPanelAction?.getDisplayName({ api }), [api]);

  const panelTitle = usePanelTitle(api);
  const ariaLabel = useMemo(
    () => (panelTitle ? getErrorCallToAction(panelTitle) : label),
    [label, panelTitle]
  );

  // Get initial editable state from action and subscribe to changes.
  useEffect(() => {
    if (!editPanelAction.couldBecomeCompatible({ api })) return;

    let canceled = false;
    const subscription = new Subscription();
    (async () => {
      const initiallyCompatible = await editPanelAction.isCompatible({ api });
      if (canceled) return;
      setIsEditable(initiallyCompatible);

      subscription.add(
        editPanelAction.subscribeToCompatibilityChanges({ api }, (isCompatible) => {
          if (!canceled) setIsEditable(isCompatible);
        })
      );
    })();

    return () => {
      canceled = true;
      subscription.unsubscribe();
    };
  }, [api]);

  return (
    <EuiEmptyPrompt
      body={
        <EuiText size="s">
          <Markdown
            markdown={error.message}
            openLinksInNewTab={true}
            data-test-subj="errorMessageMarkdown"
          />
        </EuiText>
      }
      data-test-subj="embeddableStackError"
      iconType="warning"
      iconColor="danger"
      layout="vertical"
      actions={
        isEditable && (
          <EuiButtonEmpty aria-label={ariaLabel} onClick={handleErrorClick} size="s">
            {label}
          </EuiButtonEmpty>
        )
      }
    />
  );
};
