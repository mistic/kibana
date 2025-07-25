/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  AnalyticsServiceStart,
  ApplicationStart,
  ChromeStart,
  DocLinksStart,
  HttpSetup,
  I18nStart,
  IUiSettingsClient,
  NotificationsStart,
  OverlayStart,
  ScopedHistory,
  ThemeServiceStart,
  UserProfileService,
} from '@kbn/core/public';
import type { DataPublicPluginStart } from '@kbn/data-plugin/public';
import type { DataViewsPublicPluginStart } from '@kbn/data-views-plugin/public';
import type { SharePluginStart } from '@kbn/share-plugin/public';
import type { SpacesPluginStart } from '@kbn/spaces-plugin/public';
import type { UnifiedSearchPublicPluginStart } from '@kbn/unified-search-plugin/public';
import type { SavedSearchPublicPluginStart } from '@kbn/saved-search-plugin/public';
import type { ContentManagementPublicStart } from '@kbn/content-management-plugin/public';

import { useKibana } from '@kbn/kibana-react-plugin/public';
import type { Storage } from '@kbn/kibana-utils-plugin/public';

import type { TriggersAndActionsUIPublicPluginStart } from '@kbn/triggers-actions-ui-plugin/public';
import type { UsageCollectionStart } from '@kbn/usage-collection-plugin/public';
import type { ChartsPluginStart } from '@kbn/charts-plugin/public';
import type { FieldFormatsStart } from '@kbn/field-formats-plugin/public';
import type { SavedObjectsManagementPluginStart } from '@kbn/saved-objects-management-plugin/public';
import type { SettingsStart } from '@kbn/core-ui-settings-browser';
import type { DataViewEditorStart } from '@kbn/data-view-editor-plugin/public';
import type { FieldsMetadataPublicStart } from '@kbn/fields-metadata-plugin/public';

export interface AppDependencies {
  analytics: AnalyticsServiceStart;
  application: ApplicationStart;
  charts: ChartsPluginStart;
  chrome: ChromeStart;
  data: DataPublicPluginStart;
  dataViewEditor?: DataViewEditorStart;
  dataViews: DataViewsPublicPluginStart;
  docLinks: DocLinksStart;
  fieldFormats: FieldFormatsStart;
  http: HttpSetup;
  i18n: I18nStart;
  notifications: NotificationsStart;
  uiSettings: IUiSettingsClient;
  savedSearch: SavedSearchPublicPluginStart;
  storage: Storage;
  overlays: OverlayStart;
  theme: ThemeServiceStart;
  userProfile: UserProfileService;
  history: ScopedHistory;
  share: SharePluginStart;
  spaces?: SpacesPluginStart;
  triggersActionsUi: TriggersAndActionsUIPublicPluginStart;
  unifiedSearch: UnifiedSearchPublicPluginStart;
  usageCollection?: UsageCollectionStart;
  savedObjectsManagement: SavedObjectsManagementPluginStart;
  settings: SettingsStart;
  contentManagement: ContentManagementPublicStart;
  fieldsMetadata: FieldsMetadataPublicStart;
}

export const useAppDependencies = () => {
  return useKibana().services as AppDependencies;
};

export const useToastNotifications = () => {
  const {
    notifications: { toasts: toastNotifications },
  } = useAppDependencies();
  return toastNotifications;
};
