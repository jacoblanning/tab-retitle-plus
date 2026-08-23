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
    const baseClass = 'primary-button flex-1';
    if (saveState === 'success') return `${baseClass} border-green-700 bg-green-700`;
    if (saveState === 'error') return `${baseClass} border-destructive bg-destructive`;
    return baseClass;
  };

  const getSaveButtonText = () => {
    if (saveState === 'saving') return 'Saving...';
    if (saveState === 'success') return 'Saved!';
    if (saveState === 'error') return saveMessage;
    return 'Save Title';
  };

  if (tabLoading) {
    return (
      <div className="popup-shell">
        <div className="product-header">
          <div className="product-lockup">
            <img className="product-mark" src="./icons/icon48.png" alt="" />
            <div>
              <h1 className="product-title">Tab ReTitle+</h1>
              <p className="product-subtitle">Rename this tab, once or automatically</p>
            </div>
          </div>
        </div>
        <div className="popup-content">
          <p className="text-sm text-muted-foreground">Loading current tab...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-shell">
      <header className="product-header">
        <div className="product-lockup">
          <img className="product-mark" src="./icons/icon48.png" alt="" />
          <div className="min-w-0">
            <h1 className="product-title">Tab ReTitle+</h1>
            <p className="product-subtitle">Rename this tab, once or automatically</p>
          </div>
        </div>
        <button onClick={handleOpenOptions} className="icon-button" aria-label="Open settings">
          <Settings className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="popup-content">
        <section>
          <label htmlFor="title-input" className="field-label">Custom title</label>
          <input
            id="title-input"
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            className="title-input"
            placeholder="Enter custom title..."
            autoFocus
          />
        </section>

        <section id="preview-container">
          <span className="field-label">Preview</span>
          <div id="title-preview" className="preview-card truncate">
            {getPreviewText() || customTitle || 'No title set'}
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
            Use <code className="rounded bg-accent px-1 py-0.5 text-accent-foreground">{'{original}'}</code> or{' '}
            <code className="rounded bg-accent px-1 py-0.5 text-accent-foreground">$0</code> to include the original title.
          </p>
        </section>

        <fieldset>
          <legend className="field-label">Apply title to</legend>
          <div className="choice-list">
            {storageOptions.map((option) => {
              const selected = storageType === option.value;
              return (
                <label key={option.value} className="choice-row">
                  <input
                    type="radio"
                    name="storage-type"
                    value={option.value}
                    checked={selected}
                    onChange={(e) => setStorageType(e.target.value as StorageTypeValue)}
                    className="sr-only"
                  />
                  <span className={`choice-indicator ${selected ? 'choice-indicator-selected' : ''}`} aria-hidden="true">
                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                  </span>
                  <span className="min-w-0 text-xs font-medium text-foreground">
                    {option.label} <span className="font-normal text-muted-foreground">· {option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex gap-2">
          <button
            id="save-btn"
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className={getSaveButtonClass()}
          >
            {getSaveButtonText()}
          </button>
          <button id="clear-btn" onClick={handleClear} className="secondary-button">
            Clear
          </button>
        </div>

        {existingRules.length > 0 && (
          <section id="existing-rules-container" className="border-t border-border pt-3">
            <h2 className="field-label">Saved rules for this page</h2>
            <div id="existing-rules-list" className="space-y-2">
              {existingRules.map((rule, index) => {
                const isActive = index === 0;
                return (
                  <div key={`${rule.type}-${rule.key}`} className={`rule-card ${isActive ? 'rule-card-active' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="truncate text-[11px] font-semibold text-muted-foreground">{rule.label}</span>
                          {isActive && <span className="success-badge">Active</span>}
                        </div>
                        <code className="block truncate text-xs text-primary">{rule.title}</code>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="edit-rule-btn rounded-lg bg-accent px-2 py-1 text-[11px] font-semibold text-accent-foreground hover:brightness-95"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          className="delete-rule-btn destructive-text rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold hover:bg-muted"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <footer className="popup-footer">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Keyboard className="h-3 w-3" aria-hidden="true" />
          <span>Shortcut</span>
          {shortcut === null ? (
            <span>Loading...</span>
          ) : shortcut === '' ? (
            <span>Not set</span>
          ) : (
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">{shortcut}</kbd>
          )}
          <button onClick={handleOpenOptions} className="ml-auto font-semibold text-primary hover:underline" id="open-options">
            Options
          </button>
        </div>
        <div className="truncate">
          URL: <span id="current-url" className="text-foreground">{tab ? getDomain(tab.url || '') || tab.url : ''}</span>
        </div>
        <div id="current-title-display" className="truncate">
          Title: <span id="current-title" className="text-foreground">{tab?.title || ''}</span>
        </div>
      </footer>
    </div>
  );
}
