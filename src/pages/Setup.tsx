import { useState, useEffect } from "react";
import {
  AIConfig,
  loadState,
  saveState,
  exportState,
  importState,
} from "../lib/storage";

export default function Setup() {
  const [cfg, setCfg] = useState<AIConfig | undefined>(undefined);
  const [jsonIn, setJsonIn] = useState("");
  const [exportText, setExportText] = useState("");

  useEffect(() => {
    const s = loadState();
    setCfg(s.aiConfig as AIConfig | undefined);
  }, []);

  function update<K extends keyof AIConfig>(k: K, v: AIConfig[K]) {
    const next = {
      ...(cfg || {
        basePath: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o-mini",
        apiKey: "",
      }),
      [k]: v,
    } as AIConfig;
    setCfg(next);
    const s = loadState();
    s.aiConfig = next;
    saveState(s);
  }

  function handleExport() {
    const txt = exportState();
    setExportText(txt);
  }

  function handleImport() {
    if (!jsonIn) return;
    const ok = importState(jsonIn);
    if (ok) alert("Import successful");
    else alert("Import failed");
  }

  function clearAll() {
    if (!confirm("Alle lokalen Daten löschen?")) return;
    localStorage.clear();
    setCfg(undefined);
    alert("Gelöscht");
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">KI Setup</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <label className="block mt-2 mb-1">Base Path</label>
          <input
            className="w-full input"
            value={
              cfg?.basePath || "https://api.openai.com/v1/chat/completions"
            }
            onChange={(e) => update("basePath", e.target.value)}
          />

          <label className="block mt-2 mb-1">Model</label>
          <input
            className="w-full input"
            value={cfg?.model || "gpt-4o-mini"}
            onChange={(e) => update("model", e.target.value)}
          />

          <label className="block mt-2 mb-1">API Key</label>
          <input
            className="w-full input"
            value={cfg?.apiKey || ""}
            onChange={(e) => update("apiKey", e.target.value)}
          />
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Backup / Restore</h3>
          <button
            onClick={handleExport}
            className="mt-2 px-3 py-2 bg-primary text-white rounded"
          >
            Exportieren
          </button>
          {exportText && (
            <textarea
              className="w-full mt-2 textarea"
              rows={8}
              readOnly
              value={exportText}
            />
          )}

          <div className="mt-4">
            <label className="block">JSON zum Import</label>
            <textarea
              className="w-full textarea"
              rows={6}
              value={jsonIn}
              onChange={(e) => setJsonIn(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleImport}
                className="px-3 py-2 bg-primary text-white rounded"
              >
                Importieren
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportText);
                }}
                className="px-3 py-2 border rounded"
              >
                Kopieren
              </button>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={clearAll}
              className="px-3 py-2 bg-red-600 text-white rounded"
            >
              Alles löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
