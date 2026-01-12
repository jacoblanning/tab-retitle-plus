import './styles/options.css';
import { createMessage } from '@shared/messages';
import type { GetSavedTitlesResponse } from '@shared/messages';
import type { Settings } from '@shared/types';

class OptionsApp {
  async init() {
    await this.loadSettings();
    await this.loadSavedTitles();
    this.attachListeners();
    this.attachShortcutListener();
  }

  private async loadSettings() {
    const result = await chrome.storage.sync.get('settings');
    const settings: Settings = (result.settings as Settings) || {
      enableBookmarkTitles: false,
      enableContextMenu: true,
      debugMode: false,
    };

    const bookmarkCheckbox = document.getElementById('enable-bookmark-titles') as HTMLInputElement;
    const contextMenuCheckbox = document.getElementById('enable-context-menu') as HTMLInputElement;
    const debugCheckbox = document.getElementById('debug-mode') as HTMLInputElement;

    if (bookmarkCheckbox) bookmarkCheckbox.checked = settings.enableBookmarkTitles;
    if (contextMenuCheckbox) contextMenuCheckbox.checked = settings.enableContextMenu;
    if (debugCheckbox) debugCheckbox.checked = settings.debugMode;
  }

  private async loadSavedTitles() {
    try {
      const response = await chrome.runtime.sendMessage(
        createMessage('GET_SAVED_TITLES', {})
      ) as GetSavedTitlesResponse;

      const container = document.getElementById('saved-titles');
      if (!container) return;

      let hasAny = false;
      let html = '';

      // Display URL titles
      if (Object.keys(response.urlTitles).length > 0) {
        hasAny = true;
        html += '<div class="mb-4"><h3 class="font-semibold text-gray-700 mb-2">URL-specific Titles</h3>';
        for (const [url, data] of Object.entries(response.urlTitles)) {
          html += this.renderTitleEntry('url', url, data.title);
        }
        html += '</div>';
      }

      // Display domain titles
      if (Object.keys(response.domainTitles).length > 0) {
        hasAny = true;
        html += '<div class="mb-4"><h3 class="font-semibold text-gray-700 mb-2">Domain-wide Titles</h3>';
        for (const [domain, data] of Object.entries(response.domainTitles)) {
          html += this.renderTitleEntry('domain', domain, data.title);
        }
        html += '</div>';
      }

      // Display tab titles
      if (Object.keys(response.tabTitles).length > 0) {
        hasAny = true;
        html += '<div class="mb-4"><h3 class="font-semibold text-gray-700 mb-2">Tab-specific Titles</h3>';
        for (const [tabId, data] of Object.entries(response.tabTitles)) {
          html += this.renderTitleEntry('tab', tabId, data.title, data.originalUrl);
        }
        html += '</div>';
      }

      if (!hasAny) {
        html = '<p class="text-sm text-gray-500">No saved titles yet. Use the extension popup to create custom titles!</p>';
      }

      container.innerHTML = html;

      // Attach delete button listeners
      container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const target = e.target as HTMLElement;
          const type = target.dataset.type as 'tab' | 'url' | 'domain' | 'regex';
          const key = target.dataset.key;
          if (type && key) {
            await this.deleteTitle(type, key);
          }
        });
      });

    } catch (error) {
      console.error('Error loading saved titles:', error);
      const container = document.getElementById('saved-titles');
      if (container) {
        container.innerHTML = '<p class="text-sm text-red-600">Error loading saved titles</p>';
      }
    }
  }

  private renderTitleEntry(type: string, key: string, title: string, url?: string): string {
    const displayKey = url || key;
    return `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">${this.escapeHtml(title)}</p>
          <p class="text-xs text-gray-500 truncate">${this.escapeHtml(displayKey)}</p>
        </div>
        <button
          class="delete-btn ml-4 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-300"
          data-type="${type}"
          data-key="${this.escapeHtml(key)}"
        >
          Delete
        </button>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private async deleteTitle(type: 'tab' | 'url' | 'domain' | 'regex', key: string) {
    try {
      await chrome.runtime.sendMessage(
        createMessage('DELETE_TITLE', { type, key })
      );
      await this.loadSavedTitles();
    } catch (error) {
      console.error('Error deleting title:', error);
      alert('Failed to delete title');
    }
  }

  private attachListeners() {
    // Save settings when checkboxes change
    const bookmarkCheckbox = document.getElementById('enable-bookmark-titles') as HTMLInputElement;
    const contextMenuCheckbox = document.getElementById('enable-context-menu') as HTMLInputElement;
    const debugCheckbox = document.getElementById('debug-mode') as HTMLInputElement;

    const saveSettings = async () => {
      const settings = {
        enableBookmarkTitles: bookmarkCheckbox?.checked || false,
        enableContextMenu: contextMenuCheckbox?.checked || true,
        debugMode: debugCheckbox?.checked || false,
      };

      await chrome.storage.sync.set({ settings });
    };

    bookmarkCheckbox?.addEventListener('change', saveSettings);
    contextMenuCheckbox?.addEventListener('change', saveSettings);
    debugCheckbox?.addEventListener('change', saveSettings);
  }

  private attachShortcutListener() {
    const shortcutBtn = document.getElementById('customize-shortcut-btn');
    if (shortcutBtn) {
      shortcutBtn.addEventListener('click', () => {
        // Open Chrome's keyboard shortcuts page
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
      });
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsApp().init();
});
