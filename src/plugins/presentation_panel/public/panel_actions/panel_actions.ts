/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { uiActions } from '../kibana_services';
import { CustomizePanelAction } from './customize_panel_action';
import { EditPanelAction } from './edit_panel_action/edit_panel_action';
import { InspectPanelAction } from './inspect_panel_action/inspect_panel_action';
import { RemovePanelAction } from './remove_panel_action/remove_panel_action';

// export these actions to make them accessible in this plugin.
export let customizePanelAction: CustomizePanelAction;
export let editPanelAction: EditPanelAction;

export const registerActions = () => {
  editPanelAction = new EditPanelAction();
  customizePanelAction = new CustomizePanelAction(editPanelAction);

  const removePanel = new RemovePanelAction();
  const inspectPanel = new InspectPanelAction();

  uiActions.registerAction(removePanel);
  uiActions.registerAction(inspectPanel);
  uiActions.registerAction(editPanelAction);
  uiActions.registerAction(customizePanelAction);
};
