import { useState, useEffect, useRef } from 'react';
import { createMessage } from '@shared/messages';
import type { GetSavedTitlesResponse } from '@shared/messages';
import type { Settings as SettingsType } from '@shared/types';

interface SavedTitle {
  type: 'tab' | 'url' | 'domain';
  key: string;
  title: string;
  displayKey: string;
}

type EditState = 'idle' | 'saving' | 'error';

function getRuleId(rule: SavedTitle): string {
  return `${rule.type}:${rule.key}`;
}

export function OptionsApp() {
  const [settings, setSettings] = useState<SettingsType>({
    enableBookmarkTitles: false,
    enableContextMenu: true,
    debugMode: false,
  });
  const [savedTitles, setSavedTitles] = useState<{
    urlTitles: SavedTitle[];
    domainTitles: SavedTitle[];
    tabTitles: SavedTitle[];
  }>({
    urlTitles: [],
    domainTitles: [],
    tabTitles: [],
  });
  const [loading, setLoading] = useState(true);
  const [shortcut, setShortcut] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<SavedTitle | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editState, setEditState] = useState<EditState>('idle');
  const [editError, setEditError] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const editButtonRefs = useRef(new Map<string, HTMLButtonElement>());

  // Load settings and saved titles
  useEffect(() => {
    loadSettings();
    loadSavedTitles();
    loadShortcut();
  }, []);

  useEffect(() => {
    if (!editingRule) return;

    window.requestAnimationFrame(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    });
  }, [editingRule]);

  const loadShortcut = () => {
    chrome.commands.getAll((commands) => {
      const executeAction = commands.find(cmd => cmd.name === '_execute_action');
      if (executeAction) {
        setShortcut(executeAction.shortcut || '');
      }
    });
  };

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get('settings');
      const loadedSettings = result.settings as SettingsType;
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadSavedTitles = async () => {
    try {
      setLoading(true);
      const response = await chrome.runtime.sendMessage(
        createMessage('GET_SAVED_TITLES', {})
      ) as GetSavedTitlesResponse;

      const urlTitles: SavedTitle[] = Object.entries(response.urlTitles).map(([url, data]) => ({
        type: 'url',
        key: url,
        title: data.title,
        displayKey: url,
      }));

      const domainTitles: SavedTitle[] = Object.entries(response.domainTitles).map(([domain, data]) => ({
        type: 'domain',
        key: domain,
        title: data.title,
        displayKey: domain,
      }));

      const tabTitles: SavedTitle[] = Object.entries(response.tabTitles).map(([tabId, data]) => ({
        type: 'tab',
        key: tabId,
        title: data.title,
        displayKey: data.originalUrl,
      }));

      setSavedTitles({ urlTitles, domainTitles, tabTitles });
    } catch (error) {
      console.error('Error loading saved titles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof SettingsType, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await chrome.storage.sync.set({ settings: newSettings });
  };

  const handleDeleteTitle = async (type: 'tab' | 'url' | 'domain', key: string) => {
    if (!confirm('Are you sure you want to delete this title?')) return;

    try {
      await chrome.runtime.sendMessage(
        createMessage('DELETE_TITLE', { type, key })
      );
      await loadSavedTitles();
    } catch (error) {
      console.error('Error deleting title:', error);
      alert('Failed to delete title');
    }
  };

  const focusEditButton = (ruleId: string) => {
    window.requestAnimationFrame(() => {
      editButtonRefs.current.get(ruleId)?.focus();
    });
  };

  const handleEditTitle = (rule: SavedTitle) => {
    if (editState === 'saving') return;

    setEditingRule(rule);
    setEditValue(rule.title);
    setEditState('idle');
    setEditError('');
  };

  const handleCancelEdit = () => {
    if (!editingRule) return;

    const ruleId = getRuleId(editingRule);
    setEditingRule(null);
    setEditValue('');
    setEditState('idle');
    setEditError('');
    focusEditButton(ruleId);
  };

  const handleUpdateTitle = async () => {
    if (!editingRule || editState === 'saving') return;

    const ruleId = getRuleId(editingRule);
    setEditState('saving');
    setEditError('');

    try {
      const response = await chrome.runtime.sendMessage(
        createMessage('UPDATE_SAVED_TITLE', {
          type: editingRule.type,
          key: editingRule.key,
          title: editValue,
        })
      ) as { success?: boolean; error?: string };

      if (!response?.success) {
        setEditState('error');
        setEditError(response?.error || 'Failed to update title');
        return;
      }

      const collection = editingRule.type === 'tab'
        ? 'tabTitles'
        : editingRule.type === 'url'
          ? 'urlTitles'
          : 'domainTitles';

      setSavedTitles((current) => ({
        ...current,
        [collection]: current[collection].map((item) =>
          item.key === editingRule.key ? { ...item, title: editValue } : item
        ),
      }));
      setEditingRule(null);
      setEditValue('');
      setEditState('idle');
      setEditError('');
      focusEditButton(ruleId);
    } catch (error) {
      console.error('Error updating title:', error);
      setEditState('error');
      setEditError('Failed to update title');
    }
  };

  const handleCustomizeShortcut = () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  };

  const renderTitleSection = (title: string, titles: SavedTitle[]) => {
    if (titles.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">{title}</h3>
        <div className="space-y-2">
          {titles.map((item, index) => {
            const ruleId = getRuleId(item);
            const isEditing = editingRule ? getRuleId(editingRule) === ruleId : false;
            const inputId = `edit-${item.type}-title-${index}`;
            const errorId = `${inputId}-error`;

            return (
              <div
                key={ruleId}
                className="saved-title-item flex items-start justify-between rounded-xl border border-border bg-muted p-3"
              >
                {isEditing ? (
                  <div className="mr-4 min-w-0 flex-1">
                    <label htmlFor={inputId} className="sr-only">
                      Edit title for {item.displayKey}
                    </label>
                    <input
                      ref={editInputRef}
                      id={inputId}
                      type="text"
                      value={editValue}
                      onChange={(event) => {
                        setEditValue(event.target.value);
                        if (editState === 'error') {
                          setEditState('idle');
                          setEditError('');
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleUpdateTitle();
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          handleCancelEdit();
                        }
                      }}
                      aria-invalid={editState === 'error'}
                      aria-describedby={editError ? errorId : undefined}
                      className="edit-title-input title-input"
                    />
                    <p className="mt-1 truncate text-xs text-muted-foreground">{item.displayKey}</p>
                    {editError && (
                      <p id={errorId} role="alert" className="edit-title-error mt-1 text-xs destructive-text">
                        {editError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mr-4 min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.displayKey}</p>
                  </div>
                )}
                <div className="flex shrink-0 gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleUpdateTitle}
                        disabled={editState === 'saving'}
                        className="save-title-btn primary-button px-3 py-1.5 text-xs"
                      >
                        {editState === 'saving' ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={editState === 'saving'}
                        className="cancel-title-btn secondary-button px-3 py-1.5 text-xs disabled:cursor-default disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        ref={(button) => {
                          if (button) {
                            editButtonRefs.current.set(ruleId, button);
                          } else {
                            editButtonRefs.current.delete(ruleId);
                          }
                        }}
                        onClick={() => handleEditTitle(item)}
                        disabled={editState === 'saving'}
                        className="edit-title-btn rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-background disabled:cursor-default disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTitle(item.type, item.key)}
                        disabled={editState === 'saving'}
                        className="delete-title-btn destructive-text rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-background disabled:cursor-default disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const totalTitles = savedTitles.urlTitles.length + savedTitles.domainTitles.length + savedTitles.tabTitles.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <img className="h-10 w-10" src="./icons/icon48.png" alt="" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tab ReTitle+</h1>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Settings</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Manage saved title rules, shortcuts, and extension behavior.</p>
        </header>

        {/* Saved Titles Section */}
        <section id="saved-titles" className="settings-card mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Saved titles</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {totalTitles > 0
              ? `You have ${totalTitles} saved title ${totalTitles === 1 ? 'rule' : 'rules'}`
              : 'No saved titles yet. Use the extension popup to create custom titles!'}
          </p>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : totalTitles > 0 ? (
            <div>
              {renderTitleSection('URL-specific Titles', savedTitles.urlTitles)}
              {renderTitleSection('Domain-wide Titles', savedTitles.domainTitles)}
              {renderTitleSection('Tab-specific Titles', savedTitles.tabTitles)}
            </div>
          ) : null}
        </section>

        {/* Keyboard Shortcut Section */}
        <section className="settings-card mb-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Keyboard shortcut</h2>
          <div className="rounded-xl border border-primary/20 bg-accent p-4">
            <p className="text-sm text-foreground mb-2">
              <span className="font-semibold">Current shortcut:</span>{' '}
              {shortcut === null ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : shortcut === '' ? (
                <span className="text-muted-foreground">Not set</span>
              ) : (
                <kbd className="rounded-lg border border-border bg-card px-2 py-1 font-mono text-sm text-foreground">
                  {shortcut}
                </kbd>
              )}
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Press this shortcut to quickly open the Tab ReTitle+ popup on any page.
            </p>
            <button
              onClick={handleCustomizeShortcut}
              className="primary-button"
              id="customize-shortcut-btn"
            >
              Customize Keyboard Shortcut
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Default: <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-xs">Ctrl+Shift+E</kbd> (Mac: <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-xs">Cmd+Shift+E</kbd>)
              {shortcut === '' && ' - No shortcut currently set. Click above to configure one.'}
              {shortcut && shortcut !== '' && shortcut !== 'Ctrl+Shift+E' && shortcut !== 'Command+Shift+E' && ' - You have customized this shortcut.'}
            </p>
          </div>
        </section>

        {/* General Settings Section */}
        <section className="settings-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">General settings</h2>
          <div className="space-y-1">
            <label className="settings-row cursor-pointer">
              <input
                id="enable-bookmark-titles"
                type="checkbox"
                checked={settings.enableBookmarkTitles}
                onChange={(e) => handleSettingChange('enableBookmarkTitles', e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-border bg-background text-primary accent-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Enable bookmark titles
                </span>
                <p className="text-xs text-muted-foreground">
                  Use bookmark titles as fallback when no custom title is set
                </p>
              </div>
            </label>
            <label className="settings-row cursor-pointer">
              <input
                id="enable-context-menu"
                type="checkbox"
                checked={settings.enableContextMenu}
                onChange={(e) => handleSettingChange('enableContextMenu', e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-border bg-background text-primary accent-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Enable context menu
                </span>
                <p className="text-xs text-muted-foreground">
                  Show "Set Custom Title" in the right-click context menu
                </p>
              </div>
            </label>
            <label className="settings-row cursor-pointer">
              <input
                id="debug-mode"
                type="checkbox"
                checked={settings.debugMode}
                onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-border bg-background text-primary accent-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Debug mode</span>
                <p className="text-xs text-muted-foreground">
                  Enable detailed console logging for troubleshooting
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>Tab ReTitle+ v3.0.3</p>
        </footer>
      </div>
    </div>
  );
}
