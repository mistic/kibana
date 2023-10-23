/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useMemo, useState } from 'react';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
  EuiSuperDatePicker,
  EuiSwitch,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { UI_SETTINGS } from '@kbn/data-plugin/public';
import {
  apiPublishesLocalUnifiedSearch,
  getDefaultPanelDescription,
  getDefaultPanelTitle,
  getHidePanelTitle,
  getLocalTimeRange,
  getPanelDescription,
  getPanelTitle,
  getViewMode,
} from '@kbn/presentation-publishing';

import { core } from '../../kibana_services';
import { EditPanelAction } from '../edit_panel_action/edit_panel_action';
import { CustomizePanelActionApi } from './customize_panel_action';
import { FiltersDetails } from './filters_details';

interface TimePickerQuickRange {
  from: string;
  to: string;
  display: string;
}

export const CustomizePanelEditor = ({
  api,
  onClose,
  editPanelAction,
}: {
  onClose: () => void;
  api: CustomizePanelActionApi;
  editPanelAction: EditPanelAction;
}) => {
  /**
   * eventually the panel editor could be made to use state from the API instead (which will allow us to use a push flyout)
   * For now, we copy the state here with `useState` initializing it to the latest value.
   */
  const editMode = getViewMode(api) === 'edit';
  const [hideTitle, setHideTitle] = useState(getHidePanelTitle(api));
  const [panelDescription, setPanelDescription] = useState(getPanelDescription(api));
  const [panelTitle, setPanelTitle] = useState(getPanelTitle(api));
  const [localTimeRange, setLocalTimeRange] = useState(getLocalTimeRange(api));

  const [inheritsTimeRange, setInheritsTimeRange] = useState<boolean>(
    Boolean(getLocalTimeRange(api))
  );

  const commonlyUsedRangesForDatePicker = useMemo(() => {
    const commonlyUsedRanges = core.uiSettings.get<TimePickerQuickRange[]>(
      UI_SETTINGS.TIMEPICKER_QUICK_RANGES
    );
    if (!commonlyUsedRanges) return [];
    return commonlyUsedRanges.map(
      ({ from, to, display }: { from: string; to: string; display: string }) => {
        return {
          start: from,
          end: to,
          label: display,
        };
      }
    );
  }, []);

  const dateFormat = useMemo(() => core.uiSettings.get<string>(UI_SETTINGS.DATE_FORMAT), []);

  const save = () => {
    if (panelTitle !== getPanelTitle(api)) api.setPanelTitle?.(panelTitle);
    if (hideTitle !== getHidePanelTitle(api)) api.setHidePanelTitle?.(hideTitle);
    if (panelDescription !== getPanelDescription(api)) api.setPanelDescription?.(panelDescription);

    const newTimeRange = inheritsTimeRange ? localTimeRange : undefined;
    if (newTimeRange && newTimeRange !== getLocalTimeRange(api)) {
      api.setLocalTimeRange?.(newTimeRange);
    }

    onClose();
  };

  const renderCustomTitleComponent = () => {
    if (!editMode) return null;

    return (
      <>
        <EuiFormRow>
          <EuiSwitch
            checked={!hideTitle}
            data-test-subj="customEmbeddablePanelHideTitleSwitch"
            disabled={!editMode}
            id="hideTitle"
            label={
              <FormattedMessage
                defaultMessage="Show title"
                id="presentation.action.customizePanel.flyout.optionsMenuForm.showTitle"
              />
            }
            onChange={(e) => setHideTitle(!e.target.checked)}
          />
        </EuiFormRow>
        <EuiFormRow
          label={
            <FormattedMessage
              id="presentation.action.customizePanel.flyout.optionsMenuForm.panelTitleFormRowLabel"
              defaultMessage="Title"
            />
          }
          labelAppend={
            <EuiButtonEmpty
              size="xs"
              data-test-subj="resetCustomEmbeddablePanelTitleButton"
              onClick={() => setPanelTitle(getDefaultPanelTitle(api))}
              disabled={hideTitle || !editMode || getDefaultPanelTitle(api) === panelTitle}
              aria-label={i18n.translate(
                'presentation.action.customizePanel.flyout.optionsMenuForm.resetCustomTitleButtonAriaLabel',
                {
                  defaultMessage: 'Reset title',
                }
              )}
            >
              <FormattedMessage
                id="presentation.action.customizePanel.flyout.optionsMenuForm.resetCustomTitleButtonLabel"
                defaultMessage="Reset"
              />
            </EuiButtonEmpty>
          }
        >
          <EuiFieldText
            id="panelTitleInput"
            className="panelTitleInputText"
            data-test-subj="customEmbeddablePanelTitleInput"
            name="title"
            type="text"
            disabled={hideTitle || !editMode}
            value={panelTitle ?? ''}
            onChange={(e) => setPanelTitle(e.target.value)}
            aria-label={i18n.translate(
              'presentation.action.customizePanel.flyout.optionsMenuForm.panelTitleInputAriaLabel',
              {
                defaultMessage: 'Enter a custom title for your panel',
              }
            )}
          />
        </EuiFormRow>
        <EuiFormRow
          label={
            <FormattedMessage
              id="presentation.action.customizePanel.flyout.optionsMenuForm.panelDescriptionFormRowLabel"
              defaultMessage="Description"
            />
          }
          labelAppend={
            <EuiButtonEmpty
              size="xs"
              data-test-subj="resetCustomEmbeddablePanelDescriptionButton"
              onClick={() => setPanelDescription(getDefaultPanelDescription(api))}
              disabled={
                hideTitle || !editMode || getDefaultPanelDescription(api) === panelDescription
              }
              aria-label={i18n.translate(
                'presentation.action.customizePanel.flyout.optionsMenuForm.resetCustomDescriptionButtonAriaLabel',
                {
                  defaultMessage: 'Reset description',
                }
              )}
            >
              <FormattedMessage
                id="presentation.action.customizePanel.modal.optionsMenuForm.resetCustomDescriptionButtonLabel"
                defaultMessage="Reset"
              />
            </EuiButtonEmpty>
          }
        >
          <EuiTextArea
            id="panelDescriptionInput"
            className="panelDescriptionInputText"
            data-test-subj="customEmbeddablePanelDescriptionInput"
            disabled={hideTitle || !editMode}
            name="description"
            value={panelDescription ?? ''}
            onChange={(e) => setPanelDescription(e.target.value)}
            aria-label={i18n.translate(
              'presentation.action.customizePanel.flyout.optionsMenuForm.panelDescriptionAriaLabel',
              {
                defaultMessage: 'Enter a custom description for your panel',
              }
            )}
          />
        </EuiFormRow>
      </>
    );
  };

  const renderCustomTimeRangeComponent = () => {
    if (!apiPublishesLocalUnifiedSearch(api)) return null;

    return (
      <>
        <EuiFormRow>
          <EuiSwitch
            checked={!inheritsTimeRange}
            data-test-subj="customizePanelShowCustomTimeRange"
            id="showCustomTimeRange"
            label={
              <FormattedMessage
                defaultMessage="Apply custom time range"
                id="presentation.action.customizePanel.flyout.optionsMenuForm.showCustomTimeRangeSwitch"
              />
            }
            onChange={(e) => setInheritsTimeRange(!e.target.checked)}
          />
        </EuiFormRow>
        {!inheritsTimeRange ? (
          <EuiFormRow
            label={
              <FormattedMessage
                id="presentation.action.customizePanel.flyout.optionsMenuForm.panelTimeRangeFormRowLabel"
                defaultMessage="Time range"
              />
            }
          >
            <EuiSuperDatePicker
              start={localTimeRange?.from ?? undefined}
              end={localTimeRange?.to ?? undefined}
              onTimeChange={({ start, end }) => setLocalTimeRange({ from: start, to: end })}
              showUpdateButton={false}
              dateFormat={dateFormat}
              commonlyUsedRanges={commonlyUsedRangesForDatePicker}
              data-test-subj="customizePanelTimeRangeDatePicker"
            />
          </EuiFormRow>
        ) : null}
      </>
    );
  };

  const renderFilterDetails = () => {
    if (!apiPublishesLocalUnifiedSearch(api)) return null;

    return (
      <>
        <EuiSpacer size="m" />
        <FiltersDetails editMode={editMode} editPanelAction={editPanelAction} api={api} />
      </>
    );
  };

  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2>
            <FormattedMessage
              id="presentation.action.customizePanel.flyout.title"
              defaultMessage="Panel settings"
            />
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiForm>
          {renderCustomTitleComponent()}
          {renderCustomTimeRangeComponent()}
          {renderFilterDetails()}
        </EuiForm>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty data-test-subj="cancelCustomizePanelButton" onClick={onClose}>
              <FormattedMessage
                id="presentation.action.customizePanel.flyout.cancelButtonTitle"
                defaultMessage="Cancel"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton data-test-subj="saveCustomizePanelButton" onClick={save} fill>
              <FormattedMessage
                id="presentation.action.customizePanel.flyout.saveButtonTitle"
                defaultMessage="Apply"
              />
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </>
  );
};
