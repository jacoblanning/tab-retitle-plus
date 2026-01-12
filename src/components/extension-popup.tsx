import { useState } from "react"
import { Settings, Keyboard } from "lucide-react"

type StorageType = "one-time" | "tab-specific" | "exact-url" | "domain-wide"

export function ExtensionPopup() {
  const [customTitle, setCustomTitle] = useState("v0 by Vercel")
  const [storageType, setStorageType] = useState<StorageType>("one-time")

  const storageOptions: { value: StorageType; label: string; description: string }[] = [
    { value: "one-time", label: "One-time", description: "this session only" },
    { value: "tab-specific", label: "Tab-specific", description: "persists for this tab" },
    { value: "exact-url", label: "Exact URL", description: "matches full URL" },
    { value: "domain-wide", label: "Domain-wide", description: "applies to entire domain" },
  ]

  return (
    <div className="w-[320px] rounded-lg border border-border bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold text-foreground">ReTitle</h1>
        <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Custom Title Input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-foreground">Custom Title</label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full rounded-md border border-primary bg-background px-3 py-2 text-sm text-foreground outline-none ring-2 ring-primary/30 transition-all focus:ring-primary/50"
            placeholder="Enter custom title..."
          />
        </div>

        {/* Preview */}
        <div className="mb-4">
          <span className="mb-2 block text-sm text-muted-foreground">Preview:</span>
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">{customTitle || "No title set"}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Use <code className="rounded bg-muted px-1 py-0.5 text-primary">{"$original"}</code> or{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-primary">$0</code> to include the original title
          </p>
        </div>

        {/* Storage Type */}
        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium text-foreground">Storage Type</span>
          <div className="space-y-2">
            {storageOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
                    storageType === option.value ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}
                  onClick={() => setStorageType(option.value)}
                >
                  {storageType === option.value && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </div>
                <span className="text-sm text-foreground" onClick={() => setStorageType(option.value)}>
                  {option.label} <span className="text-muted-foreground">({option.description})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Save Title
          </button>
          <button className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            Clear
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          <span>Shortcut:</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            Ctrl+Shift+E
          </kbd>
          <span className="cursor-pointer text-primary hover:underline">(customizable in Options)</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="text-muted-foreground">
            Current URL: <span className="text-foreground">v0.app</span>
          </div>
          <div className="text-muted-foreground">
            Current Title: <span className="text-foreground">v0 by Vercel</span>
          </div>
        </div>
      </div>
    </div>
  )
}
