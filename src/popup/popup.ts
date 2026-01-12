import './styles/popup.css';
import type { StorageType } from '@shared/types';
import type { SaveTitlePayload } from '@shared/messages';
import { createMessage } from '@shared/messages';
import { getDomain, processTitleTemplate } from '@shared/utils';

class PopupApp {
  private currentTab: chrome.tabs.Tab | null = null;
  private storageType: StorageType = 'once';

  async init() {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;

    // Attach event listeners
    this.attachListeners();
    this.attachOptionsLink();

    // Load current info
    await this.loadCurrentInfo();

    // Load existing rules for this page
    await this.loadExistingRules();

    // Focus the input
    const input = document.getElementById('title-input') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }

  private attachListeners() {
    // Storage type radio buttons
    document.querySelectorAll('input[name="storage-type"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.storageType = (e.target as HTMLInputElement).value as StorageType;
      });
    });

    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveTitle();
      });
    }

    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearTitle();
      });
    }

    // Title input - update preview on input
    const input = document.getElementById('title-input') as HTMLInputElement;
    if (input) {
      // Enter key to save
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.saveTitle();
        }
      });

      // Update preview as user types
      input.addEventListener('input', () => {
        this.updatePreview();
      });
    }
  }

  private updatePreview() {
    const input = document.getElementById('title-input') as HTMLInputElement;
    const previewContainer = document.getElementById('preview-container');
    const previewElement = document.getElementById('title-preview');

    if (!input || !previewContainer || !previewElement) return;

    const template = input.value.trim();

    // Only show preview if there's input
    if (!template) {
      previewContainer.classList.add('hidden');
      return;
    }

    // Get original title and URL for preview
    const originalTitle = this.currentTab?.title || 'Current Page Title';
    const url = this.currentTab?.url || '';

    // Process template
    const processedTitle = processTitleTemplate(template, originalTitle, url);

    // Update preview
    previewElement.textContent = processedTitle;
    previewContainer.classList.remove('hidden');
  }

  private async loadCurrentInfo() {
    if (!this.currentTab) return;

    // Display current URL
    const urlElement = document.getElementById('current-url');
    if (urlElement && this.currentTab.url) {
      const domain = getDomain(this.currentTab.url);
      urlElement.textContent = domain || this.currentTab.url;
    }

    // Display current title
    const currentTitleDisplay = document.getElementById('current-title-display');
    const currentTitleElement = document.getElementById('current-title');
    if (currentTitleElement && this.currentTab.title) {
      currentTitleElement.textContent = this.currentTab.title;
      if (currentTitleDisplay) {
        currentTitleDisplay.classList.remove('hidden');
      }
    }

    // Pre-fill the input with current title
    const input = document.getElementById('title-input') as HTMLInputElement;
    if (input && this.currentTab.title) {
      input.value = this.currentTab.title;
      // Update preview for pre-filled value
      this.updatePreview();
    }
  }

  private async saveTitle() {
    const input = document.getElementById('title-input') as HTMLInputElement;
    const title = input.value.trim();

    if (!title || !this.currentTab) {
      this.showError('Please enter a title');
      return;
    }

    try {
      // Send message to service worker
      const payload: SaveTitlePayload = {
        title,
        storageType: this.storageType,
        tabId: this.currentTab.id,
        url: this.currentTab.url,
      };

      const response = await chrome.runtime.sendMessage(
        createMessage('SAVE_TITLE', payload)
      );

      if (response.success) {
        this.showSuccess();
        // Reload existing rules to show the new one
        await this.loadExistingRules();
        // Close popup after short delay
        setTimeout(() => window.close(), 800);
      } else {
        this.showError('Failed to save title');
      }
    } catch (error) {
      console.error('Error saving title:', error);
      this.showError('An error occurred');
    }
  }

  private clearTitle() {
    const input = document.getElementById('title-input') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  private showSuccess() {
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      saveBtn.classList.remove('bg-primary-600', 'hover:bg-primary-700');
      saveBtn.classList.add('bg-green-600');

      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('bg-green-600');
        saveBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
      }, 1000);
    }
  }

  private showError(message: string) {
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      const originalText = saveBtn.textContent;
      saveBtn.textContent = message;
      saveBtn.classList.remove('bg-primary-600', 'hover:bg-primary-700');
      saveBtn.classList.add('bg-red-600');

      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('bg-red-600');
        saveBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
      }, 2000);
    }
  }

  private async loadExistingRules() {
    if (!this.currentTab || !this.currentTab.url) return;

    try {
      const response = await chrome.runtime.sendMessage(
        createMessage('GET_SAVED_TITLES', {})
      );

      const url = this.currentTab.url;
      const domain = getDomain(url);
      const tabId = this.currentTab.id?.toString();

      const matchingRules: Array<{
        type: 'tab' | 'url' | 'domain';
        key: string;
        title: string;
        priority: number;
        label: string;
      }> = [];

      // Check for tab-specific rule
      if (tabId && response.tabTitles[tabId]) {
        matchingRules.push({
          type: 'tab',
          key: tabId,
          title: response.tabTitles[tabId].title,
          priority: 1,
          label: 'Tab-specific',
        });
      }

      // Check for URL-specific rule
      if (response.urlTitles[url]) {
        matchingRules.push({
          type: 'url',
          key: url,
          title: response.urlTitles[url].title,
          priority: 2,
          label: 'Exact URL',
        });
      }

      // Check for domain-wide rule
      if (domain && response.domainTitles[domain]) {
        matchingRules.push({
          type: 'domain',
          key: domain,
          title: response.domainTitles[domain].title,
          priority: 3,
          label: `Domain: ${domain}`,
        });
      }

      if (matchingRules.length > 0) {
        this.displayExistingRules(matchingRules);
      }
    } catch (error) {
      console.error('Error loading existing rules:', error);
    }
  }

  private displayExistingRules(rules: Array<{
    type: 'tab' | 'url' | 'domain';
    key: string;
    title: string;
    priority: number;
    label: string;
  }>) {
    const container = document.getElementById('existing-rules-container');
    const listElement = document.getElementById('existing-rules-list');

    if (!container || !listElement) return;

    // Sort by priority (lower number = higher priority)
    rules.sort((a, b) => a.priority - b.priority);

    // Clear existing content
    listElement.innerHTML = '';

    // Add each rule
    rules.forEach((rule, index) => {
      const isActive = index === 0; // First one has highest priority
      const ruleDiv = document.createElement('div');
      ruleDiv.className = `p-3 rounded border ${
        isActive
          ? 'bg-green-50 border-green-300'
          : 'bg-gray-50 border-gray-200'
      }`;

      ruleDiv.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-semibold ${
                isActive ? 'text-green-700' : 'text-gray-600'
              }">${rule.label}</span>
              ${
                isActive
                  ? '<span class="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">ACTIVE</span>'
                  : ''
              }
            </div>
            <div class="text-sm text-gray-700 mb-1">
              <span class="text-gray-600">Template:</span> <code class="bg-white px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-blue-700">${this.escapeHtml(
                rule.title
              )}</code>
            </div>
            ${
              isActive
                ? '<div class="text-xs text-green-700 italic">✓ Currently applied to this tab</div>'
                : '<div class="text-xs text-gray-500 italic">Overridden by higher priority rule</div>'
            }
          </div>
          <div class="flex flex-col gap-1">
            <button
              class="edit-rule-btn text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              data-title="${this.escapeHtml(rule.title)}"
              data-type="${rule.type}"
            >
              Edit
            </button>
            <button
              class="delete-rule-btn text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              data-type="${rule.type}"
              data-key="${this.escapeHtml(rule.key)}"
            >
              Delete
            </button>
          </div>
        </div>
      `;

      listElement.appendChild(ruleDiv);
    });

    // Attach event listeners to edit/delete buttons
    listElement.querySelectorAll('.edit-rule-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const title = target.dataset.title || '';
        const type = target.dataset.type as StorageType;
        this.editRule(title, type);
      });
    });

    listElement.querySelectorAll('.delete-rule-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const type = target.dataset.type as 'tab' | 'url' | 'domain';
        const key = target.dataset.key || '';
        await this.deleteRule(type, key);
      });
    });

    // Show the container
    container.classList.remove('hidden');
  }

  private editRule(title: string, type: StorageType) {
    // Pre-fill the input with the existing title
    const input = document.getElementById('title-input') as HTMLInputElement;
    if (input) {
      input.value = title;
      this.updatePreview();
      input.focus();
      input.select();
    }

    // Select the matching storage type
    const radio = document.querySelector(
      `input[name="storage-type"][value="${type}"]`
    ) as HTMLInputElement;
    if (radio) {
      radio.checked = true;
      this.storageType = type;
    }
  }

  private async deleteRule(type: 'tab' | 'url' | 'domain', key: string) {
    if (!confirm('Delete this title rule?')) return;

    try {
      await chrome.runtime.sendMessage(
        createMessage('DELETE_TITLE', { type, key })
      );

      // Reload existing rules to update display
      await this.loadExistingRules();

      // Show success briefly
      const container = document.getElementById('existing-rules-container');
      if (container && !document.getElementById('existing-rules-list')?.children.length) {
        container.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      this.showError('Failed to delete');
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private attachOptionsLink() {
    const optionsLink = document.getElementById('open-options');
    if (optionsLink) {
      optionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupApp().init();
});
