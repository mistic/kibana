/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiBadge, EuiNotificationBadge, EuiToolTip } from '@elastic/eui';
import { euiThemeVars } from '@kbn/ui-theme';
import React, { useEffect, useMemo, useState } from 'react';
import { Subscription } from 'rxjs';

import { getDisabledActionIds } from '@kbn/presentation-publishing';
import { uiActions } from '../../kibana_services';
import {
  panelBadgeTrigger,
  panelNotificationTrigger,
  PANEL_BADGE_TRIGGER,
  PANEL_NOTIFICATION_TRIGGER,
} from '../../panel_actions';
import { AnyApiAction } from '../../panel_actions/types';
import { PresentationPanelInternalProps } from '../types';

export const usePresentationPanelHeaderActions = (
  showNotifications: boolean,
  showBadges: boolean,
  api: unknown,
  getActions: PresentationPanelInternalProps['getActions']
) => {
  const [badges, setBadges] = useState<AnyApiAction[]>([]);
  const [notifications, setNotifications] = useState<AnyApiAction[]>([]);

  /**
   * Get all actions once on mount of the panel. Any actions that are Frequent Compatibility
   * Change Actions need to be subscribed to so they can change over the lifetime of this panel.
   */
  useEffect(() => {
    let canceled = false;
    const subscriptions = new Subscription();
    const getTriggerCompatibleActions = getActions ?? uiActions.getTriggerCompatibleActions;
    const getActionsForTrigger = async (triggerId: string) => {
      let nextActions: AnyApiAction[] =
        ((await getTriggerCompatibleActions(triggerId, {
          api,
        })) as AnyApiAction[]) ?? [];

      const disabledActions = getDisabledActionIds(api);
      if (disabledActions) {
        nextActions = nextActions.filter((badge) => disabledActions.indexOf(badge.id) === -1);
      }
      return nextActions;
    };

    const handleActionCompatibilityChange = (
      type: 'badge' | 'notification',
      isCompatible: boolean,
      action: AnyApiAction
    ) => {
      const setter = type === 'badge' ? setBadges : setNotifications;
      if (canceled) return;

      if (isCompatible) {
        setter((current) => [...current, action]);
        return;
      } else {
        setter((current) => {
          return current.filter((badge) => badge.id !== action.id);
        });
      }
    };

    (async () => {
      const [initialBadges, initialNotifications] = await Promise.all([
        getActionsForTrigger(PANEL_BADGE_TRIGGER),
        getActionsForTrigger(PANEL_NOTIFICATION_TRIGGER),
      ]);
      if (canceled) return;
      setBadges(initialBadges);
      setNotifications(initialNotifications);

      const apiContext = { api };

      // subscribe to any frequently changing badge actions
      const frequentlyChangingBadges =
        uiActions.getFrequentCompatibilityChangeActionsForTrigger(PANEL_BADGE_TRIGGER);
      for (const badge of frequentlyChangingBadges) {
        subscriptions.add(
          badge.subscribeToCompatibilityChanges(
            apiContext,
            (isComptaible: boolean, action: AnyApiAction) =>
              handleActionCompatibilityChange('badge', isComptaible, action)
          )
        );
      }

      // subscribe to any frequently changing notification actions
      const frequentlyChangingNotifications =
        uiActions.getFrequentCompatibilityChangeActionsForTrigger(PANEL_NOTIFICATION_TRIGGER);
      for (const notification of frequentlyChangingNotifications) {
        subscriptions.add(
          notification.subscribeToCompatibilityChanges(
            apiContext,
            (isComptaible: boolean, action: AnyApiAction) =>
              handleActionCompatibilityChange('notification', isComptaible, action)
          )
        );
      }
    })();

    return () => {
      canceled = true;
      subscriptions.unsubscribe();
    };
    // Disable exhaustive deps because this is meant to be run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeElements = useMemo(() => {
    if (!showBadges) return [];
    return badges?.map((badge) => (
      <EuiBadge
        key={badge.id}
        className="embPanel__headerBadge"
        iconType={badge.getIconType({ api, trigger: panelBadgeTrigger })}
        onClick={() => badge.execute({ api, trigger: panelBadgeTrigger })}
        onClickAriaLabel={badge.getDisplayName({ api, trigger: panelBadgeTrigger })}
        data-test-subj={`presentationPanelBadge-${badge.id}`}
      >
        {badge.getDisplayName({ api, trigger: panelBadgeTrigger })}
      </EuiBadge>
    ));
  }, [api, badges, showBadges]);

  const notificationElements = useMemo(() => {
    if (!showNotifications) return [];
    return notifications?.map((notification) => {
      let notificationComponent = notification.MenuItem ? (
        React.createElement(notification.MenuItem, {
          key: notification.id,
          context: {
            api,
            trigger: panelNotificationTrigger,
          },
        })
      ) : (
        <EuiNotificationBadge
          data-test-subj={`embeddablePanelNotification-${notification.id}`}
          key={notification.id}
          style={{ marginTop: euiThemeVars.euiSizeXS, marginRight: euiThemeVars.euiSizeXS }}
          onClick={() => notification.execute({ api, trigger: panelNotificationTrigger })}
        >
          {notification.getDisplayName({ api, trigger: panelNotificationTrigger })}
        </EuiNotificationBadge>
      );

      if (notification.getDisplayNameTooltip) {
        const tooltip = notification.getDisplayNameTooltip({
          api,
          trigger: panelNotificationTrigger,
        });

        if (tooltip) {
          notificationComponent = (
            <EuiToolTip position="top" delay="regular" content={tooltip} key={notification.id}>
              {notificationComponent}
            </EuiToolTip>
          );
        }
      }

      return notificationComponent;
    });
  }, [api, notifications, showNotifications]);

  return { badgeElements, notificationElements };
};
