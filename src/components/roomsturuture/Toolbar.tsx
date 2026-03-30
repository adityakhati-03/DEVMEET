"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { Undo, Redo } from "lucide-react";

type Language = {
  id: number;
  name: string;
};

type Props = {
  yUndoManager: Y.UndoManager;
  language: string;
  onLanguageChange: (lang: string) => void;
};

export function Toolbar({ yUndoManager, language, onLanguageChange }: Props) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/languages");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch languages: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setLanguages(data);
      } catch (err: any) {
        console.error("Error fetching languages:", err);
        setError(err.message || "Failed to load languages");
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {/* Language Dropdown */}
      <select
        style={{
          fontSize: "13px", padding: "6px 10px", borderRadius: "6px",
          background: "var(--dm-input)", color: "var(--dm-text)",
          border: "1px solid var(--dm-border)",
          outline: "none", cursor: "pointer", fontWeight: 600,
        }}
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        aria-label="Select language"
        disabled={loading}
      >
        {loading ? (
          <option>Loading…</option>
        ) : error ? (
          <option>Error loading</option>
        ) : (
          languages.map((lang) => (
            <option key={lang.id} value={lang.name}>
              {lang.name}
            </option>
          ))
        )}
      </select>

      {/* Undo */}
      <button
        style={{ padding: "6px", borderRadius: "6px", background: "transparent", border: "1px solid transparent", color: "var(--dm-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        className="nsoc-icon-btn"
        onClick={() => yUndoManager.undo()}
        aria-label="undo"
      >
        <Undo style={{ width: "16px", height: "16px" }} />
      </button>

      {/* Redo */}
      <button
        style={{ padding: "6px", borderRadius: "6px", background: "transparent", border: "1px solid transparent", color: "var(--dm-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        className="nsoc-icon-btn"
        onClick={() => yUndoManager.redo()}
        aria-label="redo"
      >
        <Redo style={{ width: "16px", height: "16px" }} />
      </button>
    </div>
  );
}
