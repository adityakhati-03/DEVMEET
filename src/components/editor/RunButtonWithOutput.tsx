// components/RunButtonWithOutput.tsx
"use client";

import { useState } from "react";

interface Props {
  getCode: () => string;
  languageId: number; 
}

export default function RunButtonWithOutput({ getCode, languageId }: Props) {
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    if (!languageId) {
      setOutput("Error: No language selected");
      return;
    }

    setLoading(true);
    setOutput("Running...");
    
    try {
      const resp = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: getCode(), languageId }),
      });

      const data = await resp.json();
      
      if (data.error) {
        setOutput(`Error: ${data.error}${data.details ? `\n${data.details}` : ""}`);
      } else {
        setOutput(data.output || "No output");
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message || "Failed to execute code"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={runCode}
        disabled={loading || !languageId}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Running..." : "Run"}
      </button>
      <pre className="bg-black text-white mt-2 p-2 min-h-[100px] whitespace-pre-wrap">
        {output}
      </pre>
    </div>
  );
}
