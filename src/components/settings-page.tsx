"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"

interface SavedTitle {
  id: string
  pattern: string
  title: string
  type: "domain" | "url" | "regex"
}

export function SettingsPage() {
  const [savedTitles, setSavedTitles] = useState<SavedTitle[]>([
    { id: "1", pattern: "app.veriforceone.com", title: "[PROD] {original}", type: "domain" },
    { id: "2", pattern: "github.com/*", title: "GH: {original}", type: "domain" },
  ])

  const [settings, setSettings] = useState({
    enableBookmarkTitles: false,
    enableContextMenu: true,
    debugMode: false,
  })

  const handleDelete = (id: string) => {
    setSavedTitles(savedTitles.filter((t) => t.id !== id))
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold text-foreground">Tab ReTitle+ Settings</h1>
      </div>

      <div className="divide-y divide-border">
        {/* Saved Titles Section */}
        <section className="p-6">
          <h2 className="mb-2 text-lg font-medium text-foreground">Saved Titles</h2>
          <p className="mb-4 text-sm text-muted-foreground">Manage your custom tab titles</p>

          <div className="mb-3 text-sm font-medium text-primary">Domain-wide Titles</div>

          {savedTitles.length > 0 ? (
            <div className="space-y-2">
              {savedTitles.map((title) => (
                <div
                  key={title.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                >
                  <div>
                    <div className="font-medium text-foreground">{title.title}</div>
                    <div className="text-sm text-muted-foreground">{title.pattern}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(title.id)}
                    className="rounded-md border border-destructive/50 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background p-4 text-center text-sm text-muted-foreground">
              No saved titles yet
            </div>
          )}
        </section>

        {/* Keyboard Shortcut Section */}
        <section className="p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">Keyboard Shortcut</h2>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-foreground">
              <span className="text-muted-foreground">Default shortcut:</span>
              <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs">Ctrl+Shift+E</kbd>
              <span className="text-muted-foreground">(Mac:</span>
              <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs">Cmd+Shift+E</kbd>
              <span className="text-muted-foreground">)</span>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Press this shortcut to quickly open the Tab ReTitle+ popup on any page.
            </p>

            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              <ExternalLink className="h-4 w-4" />
              Customize Keyboard Shortcut
            </button>

            <p className="mt-4 text-xs text-muted-foreground">
              Note: If the shortcut doesn't work, it may conflict with another extension or Chrome feature. Click above
              to change it.
            </p>
          </div>
        </section>

        {/* General Settings Section */}
        <section className="p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">General Settings</h2>

          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enableBookmarkTitles}
                onChange={(e) => setSettings({ ...settings, enableBookmarkTitles: e.target.checked })}
                className="h-4 w-4 rounded border-border bg-background text-primary accent-primary"
              />
              <span className="text-sm text-foreground">Enable bookmark titles</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enableContextMenu}
                onChange={(e) => setSettings({ ...settings, enableContextMenu: e.target.checked })}
                className="h-4 w-4 rounded border-border bg-background text-primary accent-primary"
              />
              <span className="text-sm text-foreground">Enable context menu</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={settings.debugMode}
                onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
                className="h-4 w-4 rounded border-border bg-background text-primary accent-primary"
              />
              <span className="text-sm text-foreground">Debug mode</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}
