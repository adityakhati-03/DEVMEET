"use client";

import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { Compartment } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { autocompletion } from "@codemirror/autocomplete";
import { useCallback, useEffect, useState, useRef } from "react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom, useSelf, useStorage, useMutation } from "@liveblocks/react/suspense";
import styles from "./CollaborativeEditor.module.css";
import { Toolbar } from "@/components/roomsturuture/Toolbar";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { Play, ChevronDown, ChevronUp, Loader2, Terminal } from "lucide-react";

export function CollaborativeEditor() {
  const room = useRoom();
  const provider = getYjsProviderForRoom(room);
  const [element, setElement] = useState<HTMLElement>();
  const [yUndoManager, setYUndoManager] = useState<Y.UndoManager>();
  const [showOutput, setShowOutput] = useState(false);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const userInfo = useSelf((me) => me.info);

  // Liveblocks replicated state
  const language = useStorage((root) => root.language) as string | undefined || "javascript";
  const output = useStorage((root) => root.output) as string | undefined || "";
  const inputValue = useStorage((root) => root.input) as string | undefined || "";
  const isExecuting = useStorage((root) => root.isExecuting) as boolean | undefined || false;

  const setLanguage = useMutation(({ storage }, newVal: string) => storage.set("language", newVal), []);
  const setOutput = useMutation(({ storage }, newVal: string) => storage.set("output", newVal), []);
  const setInputValue = useMutation(({ storage }, newVal: string) => storage.set("input", newVal), []);
  const setIsExecuting = useMutation(({ storage }, newVal: boolean) => storage.set("isExecuting", newVal), []);

  // Fetch language list once
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch("/api/languages");
        if (resp.ok) {
          const data = await resp.json();
          if (!data.error) {
            const languageMap = data.reduce((map: Record<string, number>, lang: any) => {
              map[lang.name.toLowerCase().replace(/\s+/g, "")] = lang.id;
              return map;
            }, {});
            setLanguages(languageMap);
          }
        }
      } catch (e) {
        console.error("Error fetching languages:", e);
      }
    })();
  }, []);

  const getLanguageId = (name: string): number =>
    languages[name.toLowerCase().replace(/\s+/g, "")] || 1; // Default to JS (ID 1) rather than 21 (Invalid)

  const getLanguageExtension = (lang: string) => {
    const l = lang.toLowerCase();
    if (l.includes("python")) return python();
    if (l.includes("java") && !l.includes("javascript")) return java();
    return javascript(); // Fallback gives decent C-like syntax
  };

  const viewRef = useRef<EditorView | null>(null);
  const [langCompartment] = useState(() => new Compartment());

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element || !room || !userInfo) return;
    const ydoc = provider.getYDoc();
    const ytext = ydoc.getText("codemirror");
    const undoManager = new Y.UndoManager(ytext);
    setYUndoManager(undoManager);

    provider.awareness.setLocalStateField("user", {
      name: userInfo.name,
      color: userInfo.color,
      colorLight: userInfo.color + "80",
    });

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        langCompartment.of(getLanguageExtension(language)),
        autocompletion(),
        yCollab(ytext, provider.awareness, { undoManager }),
        dracula,
      ],
    });

    const view = new EditorView({ state, parent: element });
    viewRef.current = view;
    
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [element, room, userInfo, provider]);

  // Dispatch dynamic syntax highlighting update when language state changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: langCompartment.reconfigure(getLanguageExtension(language))
      });
    }
  }, [language, langCompartment]);

  useEffect(() => {
    if (isExecuting) {
      setShowOutput(true);
    }
  }, [isExecuting]);

  const handleExecute = async () => {
    const rawCode = provider.getYDoc().getText("codemirror").toString();
    if (!rawCode || rawCode.trim() === "") {
        setOutput("Error: Code editor is empty");
        setShowOutput(true);
        return;
    }
    const langId = getLanguageId(language);
    if (!langId) { setOutput("Error: No language selected"); return; }
    if (isExecuting) return;
    
    // We update Liveblocks so everyone transitions to running state
    setIsExecuting(true);
    setOutput("Running…");
    setShowOutput(true);

    try {
      const resp = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: rawCode, languageId: langId, stdin: inputValue }),
      });
      const data = await resp.json();
      setOutput(data.error ? `Error: ${data.error}${data.details ? "\n" + data.details : ""}` : (data.output || "No output"));
    } catch (e: any) {
      setOutput(`Error: ${e.message || "Failed to execute code"}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const panelBg: React.CSSProperties = {
    background: "#0d0f14",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "6px",
    color: "#e2e8f0",
  };

  return (
    <div className={styles.container}>
      {/* Toolbar row */}
      <div className={styles.editorHeader}>
        <div style={{ flex: 1 }}>
          {yUndoManager && (
            <Toolbar yUndoManager={yUndoManager} language={language} onLanguageChange={setLanguage} />
          )}
        </div>
        {/* Run button — top right, NSOC style */}
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 16px", borderRadius: "7px",
            background: isExecuting ? "rgba(52,211,153,0.15)" : "#34d399",
            color: isExecuting ? "#34d399" : "#080a0f",
            border: isExecuting ? "1px solid rgba(52,211,153,0.3)" : "none",
            fontWeight: 700, fontSize: "13px", cursor: isExecuting ? "not-allowed" : "pointer",
            transition: "all 150ms", flexShrink: 0,
          }}
        >
          {isExecuting
            ? <><Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" /> Running…</>
            : <><Play style={{ width: "13px", height: "13px" }} /> Run</>
          }
        </button>
      </div>

      <div className={styles.leftPane}>
        <div className={styles.splitContainer}>
          <PanelGroup direction="vertical" className={styles.codePane}>
            {/* Editor */}
            <Panel minSize={40} defaultSize={62} style={{ display: "flex", flexDirection: "column" }}>
              <div className={styles.editorContainer} ref={ref} />
            </Panel>

            <PanelResizeHandle className={styles.resizableHandle} />

            {/* Input / Output panel */}
            <Panel minSize={20} defaultSize={38} className={styles.outputPane}>
              {/* Panel header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Terminal style={{ width: "13px", height: "13px", color: "#34d399" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {showOutput ? "Output" : "Input"}
                  </span>
                </div>
                <button
                  onClick={() => setShowOutput(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "5px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#78716c", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  {showOutput ? <><ChevronUp style={{ width: "12px", height: "12px" }} /> Input</> : <><ChevronDown style={{ width: "12px", height: "12px" }} /> Output</>}
                </button>
              </div>

              {showOutput ? (
                <pre style={{ ...panelBg, padding: "12px", fontSize: "13px", fontFamily: "monospace", minHeight: "60px", overflow: "auto", flex: 1, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {output || <span style={{ color: "#78716c", fontStyle: "italic" }}>(Output will appear here after you run the code)</span>}
                </pre>
              ) : (
                <textarea
                  style={{ ...panelBg, padding: "12px", fontSize: "13px", fontFamily: "monospace", width: "100%", minHeight: "80px", resize: "none", outline: "none", flex: 1, lineHeight: 1.6 }}
                  placeholder="Enter stdin data here…"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  rows={6}
                />
              )}
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}