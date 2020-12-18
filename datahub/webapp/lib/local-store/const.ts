import { IAdhocQuery } from 'const/adhocQuery';

export const DISMISSED_ANNOUNCEMENT_KEY = 'dismissed_announcement_ids';
export type DismissedAnnouncementValue = number[];

export const USER_SETTINGS_KEY = 'user_settings';
export type UserSettingsValue = Record<string, string>;

export const CHANGE_LOG_KEY = 'change_log_last_viewed';
export type ChangeLogValue = string;

export const DATA_DOC_NAV_SECTION_KEY = 'data_doc_nav_section';
export type DataDocNavSectionValue = Record<string, boolean>;

export const ADHOC_QUERY_KEY = 'adhoc_query_editor';
export type AdhocQueryValue = IAdhocQuery;
