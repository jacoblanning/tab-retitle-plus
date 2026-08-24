import type { StorageType } from './types';

// Message types
export type MessageType =
  | 'UPDATE_TITLE'
  | 'GET_CURRENT_TITLE'
  | 'SAVE_TITLE'
  | 'UPDATE_SAVED_TITLE'
  | 'DELETE_TITLE'
  | 'GET_SAVED_TITLES'
  | 'GET_QUOTA_INFO'
  | 'TITLE_UPDATED';

// Message interface
export interface Message<T = any> {
  type: MessageType;
  payload: T;
}

// Specific message payloads
export interface UpdateTitlePayload {
  title: string;
}

export interface SaveTitlePayload {
  title: string;
  storageType: StorageType;
  tabId?: number;
  url?: string;
  domain?: string;
  originalTitle?: string;
}

export interface DeleteTitlePayload {
  type: 'tab' | 'url' | 'domain' | 'regex';
  key: string;
}

export interface UpdateSavedTitlePayload {
  type: 'tab' | 'url' | 'domain';
  key: string;
  title: string;
}

export interface GetSavedTitlesResponse {
  tabTitles: Record<string, { title: string; originalUrl: string; timestamp: number }>;
  urlTitles: Record<string, { title: string; timestamp: number }>;
  domainTitles: Record<string, { title: string; timestamp: number }>;
  regexPatterns: Array<{
    id: string;
    pattern: string;
    replacement: string;
    flags: string;
    timestamp: number;
  }>;
}

// Message creation helpers
export function createMessage<T>(type: MessageType, payload: T): Message<T> {
  return { type, payload };
}
