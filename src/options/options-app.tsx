import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { createMessage } from '@shared/messages';
import type { GetSavedTitlesResponse } from '@shared/messages';
import type { Settings as SettingsType } from '@shared/types';

interface SavedTitle {
  type: 'tab' | 'url' | 'domain';
  key: string;
  title: string;
  displayKey: string;
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

  // Load settings and saved titles
  useEffect(() => {
    loadSettings();
    loadSavedTitles();
    loadShortcut();
  }, []);

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

  const handleCustomizeShortcut = () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  };

  const renderTitleSection = (title: string, titles: SavedTitle[]) => {
    if (titles.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
        <div className="space-y-2">
          {titles.map((item) => (
            <div
              key={`${item.type}-${item.key}`}
              className="flex items-center justify-between p-3 bg-muted rounded-md border border-border"
            >
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.displayKey}</p>
              </div>
              <button
                onClick={() => handleDeleteTitle(item.type, item.key)}
                className="px-3 py-1.5 text-sm text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const totalTitles = savedTitles.urlTitles.length + savedTitles.domainTitles.length + savedTitles.tabTitles.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Tab ReTitle+ Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your custom tab titles and extension settings</p>
        </div>

        {/* Saved Titles Section */}
        <section className="mb-8 bg-card p-6 rounded-lg shadow-lg border border-border">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Saved Titles</h2>
          <p className="text-sm text-muted-foreground mb-6">
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
        <section className="mb-8 bg-card p-6 rounded-lg shadow-lg border border-border">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Keyboard Shortcut</h2>
          <div className="bg-primary/10 border border-primary/30 rounded-md p-4 mb-4">
            <p className="text-sm text-foreground mb-2">
              <span className="font-semibold">Current shortcut:</span>{' '}
              {shortcut === null ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : shortcut === '' ? (
                <span className="text-muted-foreground">Not set</span>
              ) : (
                <kbd className="px-2 py-1 bg-muted border border-border rounded text-sm font-mono text-foreground">
                  {shortcut}
                </kbd>
              )}
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Press this shortcut to quickly open the Tab ReTitle+ popup on any page.
            </p>
            <button
              onClick={handleCustomizeShortcut}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              id="customize-shortcut-btn"
            >
              Customize Keyboard Shortcut
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Default: <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">Ctrl+Shift+E</kbd> (Mac: <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">Cmd+Shift+E</kbd>)
              {shortcut === '' && ' - No shortcut currently set. Click above to configure one.'}
              {shortcut && shortcut !== '' && shortcut !== 'Ctrl+Shift+E' && shortcut !== 'Command+Shift+E' && ' - You have customized this shortcut.'}
            </p>
          </div>
        </section>

        {/* General Settings Section */}
        <section className="bg-card p-6 rounded-lg shadow-lg border border-border">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">General Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.enableBookmarkTitles}
                onChange={(e) => handleSettingChange('enableBookmarkTitles', e.target.checked)}
                className="mr-3 w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary cursor-pointer"
              />
              <div>
                <span className="text-foreground group-hover:text-primary transition-colors">
                  Enable bookmark titles
                </span>
                <p className="text-xs text-muted-foreground">
                  Use bookmark titles as fallback when no custom title is set
                </p>
              </div>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.enableContextMenu}
                onChange={(e) => handleSettingChange('enableContextMenu', e.target.checked)}
                className="mr-3 w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary cursor-pointer"
              />
              <div>
                <span className="text-foreground group-hover:text-primary transition-colors">
                  Enable context menu
                </span>
                <p className="text-xs text-muted-foreground">
                  Show "Set Custom Title" in the right-click context menu
                </p>
              </div>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.debugMode}
                onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                className="mr-3 w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary cursor-pointer"
              />
              <div>
                <span className="text-foreground group-hover:text-primary transition-colors">Debug mode</span>
                <p className="text-xs text-muted-foreground">
                  Enable detailed console logging for troubleshooting
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Tab ReTitle+ v3.0.0</p>
        </footer>
      </div>
    </div>
  );
}
