import { useState, useEffect } from 'react';
import { Settings, Keyboard } from 'lucide-react';
import { useCurrentTab } from '../hooks/useCurrentTab';
import { useMessages } from '../hooks/useMessages';
import { createMessage } from '@shared/messages';
import type { SaveTitlePayload } from '@shared/messages';
import type { StorageType } from '@shared/types';
import { getDomain, processTitleTemplate } from '@shared/utils';

type StorageTypeValue = 'once' | 'tab' | 'url' | 'domain';

interface ExistingRule {
  type: 'tab' | 'url' | 'domain';
  key: string;
  title: string;
  priority: number;
  label: string;
}

export function PopupApp() {
  const { tab, loading: tabLoading } = useCurrentTab();
  const { sendMessage } = useMessages();

  const [customTitle, setCustomTitle] = useState('');
  const [storageType, setStorageType] = useState<StorageTypeValue>('once');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [existingRules, setExistingRules] = useState<ExistingRule[]>([]);
  const [shortcut, setShortcut] = useState<string | null>(null);

  const storageOptions: { value: StorageTypeValue; label: string; description: string }[] = [
    { value: 'once', label: 'One-time', description: 'this session only' },
    { value: 'tab', label: 'Tab-specific', description: 'persists for this tab' },
    { value: 'url', label: 'Exact URL', description: 'matches full URL' },
    { value: 'domain', label: 'Domain-wide', description: 'applies to entire domain' },
  ];

  // Load current title and existing rules
  useEffect(() => {
    if (tab?.title) {
      setCustomTitle(tab.title);
    }
    if (tab?.url) {
      loadExistingRules();
    }
  }, [tab]);

  // Load keyboard shortcut
  useEffect(() => {
    chrome.commands.getAll((commands) => {
      const executeAction = commands.find(cmd => cmd.name === '_execute_action');
      if (executeAction) {
        setShortcut(executeAction.shortcut || '');
      }
    });
  }, []);

  const loadExistingRules = async () => {
    if (!tab || !tab.url) return;

    try {
      const response = await sendMessage(createMessage('GET_SAVED_TITLES', {}));
      const url = tab.url;
      const domain = getDomain(url);
      const tabId = tab.id?.toString();

      const rules: ExistingRule[] = [];

      // Check for tab-specific rule
      if (tabId && response.tabTitles?.[tabId]) {
        rules.push({
          type: 'tab',
          key: tabId,
          title: response.tabTitles[tabId].title,
          priority: 1,
          label: 'Tab-specific',
        });
      }

      // Check for URL-specific rule
      if (response.urlTitles?.[url]) {
        rules.push({
          type: 'url',
          key: url,
          title: response.urlTitles[url].title,
          priority: 2,
          label: 'Exact URL',
        });
      }

      // Check for domain-wide rule
      if (domain && response.domainTitles?.[domain]) {
        rules.push({
          type: 'domain',
          key: domain,
          title: response.domainTitles[domain].title,
          priority: 3,
          label: `Domain: ${domain}`,
        });
      }

      // Sort by priority (lower number = higher priority)
      rules.sort((a, b) => a.priority - b.priority);
      setExistingRules(rules);
    } catch (error) {
      console.error('Error loading existing rules:', error);
    }
  };

  const handleSave = async () => {
    if (!customTitle.trim() || !tab) {
      setSaveState('error');
      setSaveMessage('Please enter a title');
      setTimeout(() => setSaveState('idle'), 2000);
      return;
    }

    try {
      setSaveState('saving');

      const payload: SaveTitlePayload = {
        title: customTitle,
        storageType: storageType as StorageType,
        tabId: tab.id,
        url: tab.url,
        originalTitle: tab.title,
      };

      const response = await sendMessage(createMessage('SAVE_TITLE', payload));

      if (response.success) {
        setSaveState('success');
        setSaveMessage('Saved!');
        await loadExistingRules();
        setTimeout(() => {
          window.close();
        }, 800);
      } else {
        setSaveState('error');
        setSaveMessage('Failed to save title');
        setTimeout(() => setSaveState('idle'), 2000);
      }
    } catch (error) {
      console.error('Error saving title:', error);
      setSaveState('error');
      setSaveMessage('An error occurred');
      setTimeout(() => setSaveState('idle'), 2000);
    }
  };

  const handleClear = () => {
    setCustomTitle('');
  };

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleEditRule = (rule: ExistingRule) => {
    setCustomTitle(rule.title);
    setStorageType(rule.type === 'tab' ? 'tab' : rule.type === 'url' ? 'url' : 'domain');
  };

  const handleDeleteRule = async (rule: ExistingRule) => {
    if (!confirm('Delete this title rule?')) return;

    try {
      await sendMessage(createMessage('DELETE_TITLE', { type: rule.type, key: rule.key }));
      await loadExistingRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const getPreviewText = () => {
    if (!customTitle.trim() || !tab) return '';
    return processTitleTemplate(customTitle, tab.title || '', tab.url || '');
  };

  const getSaveButtonClass = () => {
    const baseClass = 'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors';
    if (saveState === 'success') return `${baseClass} bg-green-600 text-white`;
    if (saveState === 'error') return `${baseClass} bg-red-600 text-white`;
    return `${baseClass} bg-primary text-primary-foreground hover:bg-primary/90`;
  };

  const getSaveButtonText = () => {
    if (saveState === 'saving') return 'Saving...';
    if (saveState === 'success') return 'Saved!';
    if (saveState === 'error') return saveMessage;
    return 'Save Title';
  };

  if (tabLoading) {
    return (
      <div className="w-[320px] p-4 bg-card">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-[320px] bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h1 className="text-base font-semibold text-foreground">Tab ReTitle+</h1>
        <button
          onClick={handleOpenOptions}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Custom Title Input */}
        <div className="mb-3">
          <label htmlFor="title-input" className="mb-1.5 block text-sm font-medium text-foreground">
            Custom Title
          </label>
          <input
            id="title-input"
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            className="w-full rounded-md border border-primary bg-background px-3 py-1.5 text-sm text-foreground outline-none ring-2 ring-primary/30 transition-all focus:ring-primary/50"
            placeholder="Enter custom title..."
            autoFocus
          />
        </div>

        {/* Preview */}
        <div id="preview-container" className="mb-3">
          <span className="mb-1.5 block text-sm text-muted-foreground">Preview:</span>
          <div id="title-preview" className="rounded-md bg-muted px-3 py-1.5 text-sm text-foreground">
            {getPreviewText() || customTitle || 'No title set'}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Use <code className="rounded bg-muted px-1 py-0.5 text-primary">{'{original}'}</code> or{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-primary">$0</code> to include the original title
          </p>
        </div>

        {/* Storage Type */}
        <div className="mb-3">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Storage Type</span>
          <div className="space-y-1">
            {storageOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 transition-colors hover:bg-muted"
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
                    storageType === option.value ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}
                  onClick={() => setStorageType(option.value)}
                >
                  {storageType === option.value && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </div>
                <span className="text-sm text-foreground" onClick={() => setStorageType(option.value)}>
                  {option.label} <span className="text-muted-foreground">({option.description})</span>
                </span>
                <input
                  type="radio"
                  name="storage-type"
                  value={option.value}
                  checked={storageType === option.value}
                  onChange={(e) => setStorageType(e.target.value as StorageTypeValue)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            id="save-btn"
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className={getSaveButtonClass()}
          >
            {getSaveButtonText()}
          </button>
          <button
            id="clear-btn"
            onClick={handleClear}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          <span>Shortcut:</span>
          {shortcut === null ? (
            <span className="text-xs text-muted-foreground">Loading...</span>
          ) : shortcut === '' ? (
            <span className="text-xs text-muted-foreground">Not set</span>
          ) : (
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              {shortcut}
            </kbd>
          )}
          <button onClick={handleOpenOptions} className="cursor-pointer text-primary hover:underline text-xs" id="open-options">
            (Options)
          </button>
        </div>
        <div className="space-y-0.5 text-xs">
          <div className="text-muted-foreground">
            URL: <span id="current-url" className="text-foreground">{tab ? getDomain(tab.url || '') || tab.url : ''}</span>
          </div>
          <div id="current-title-display" className="text-muted-foreground">
            Title: <span id="current-title" className="text-foreground">{tab?.title || ''}</span>
          </div>
        </div>
      </div>

      {/* Existing Rules Section (if any) */}
      {existingRules.length > 0 && (
        <div id="existing-rules-container" className="border-t border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground mb-2">Saved Rules for This Page</h3>
          <div id="existing-rules-list" className="space-y-2">
            {existingRules.map((rule, index) => {
              const isActive = index === 0;
              return (
                <div
                  key={`${rule.type}-${rule.key}`}
                  className={`p-2 rounded-md border ${
                    isActive
                      ? 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800'
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold ${
                            isActive ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
                          }`}
                        >
                          {rule.label}
                        </span>
                        {isActive && (
                          <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full font-medium">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-foreground">
                        <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs font-mono text-primary">
                          {rule.title}
                        </code>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="edit-rule-btn text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule)}
                        className="delete-rule-btn text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
