/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { Subscription } from 'rxjs';
import { Action } from './action';

/**
 * Used for actions which frequently change their compatibility status based on some state from their context.
 */
export interface FrequentCompatibilityChangeAction<Context extends object = object>
  extends Action<Context> {
  subscribeToCompatibilityChanges: (
    context: Context,
    onChange: (isCompatible: boolean, action: Action<Context>) => void
  ) => Subscription | undefined;
  couldBecomeCompatible: (context: Context) => boolean;
}

export const isFrequentCompatibilityChangeAction = (
  action: Action
): action is FrequentCompatibilityChangeAction => {
  return Boolean(
    (action as FrequentCompatibilityChangeAction).subscribeToCompatibilityChanges &&
      (action as FrequentCompatibilityChangeAction).couldBecomeCompatible
  );
};
