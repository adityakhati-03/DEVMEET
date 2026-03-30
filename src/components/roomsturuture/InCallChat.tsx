"use client";

import { useState, useRef, useEffect } from "react";
import { useStorage, useMutation, useSelf } from "@liveblocks/react/suspense";
import { Send, MessageSquare } from "lucide-react";

export function InCallChat() {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to Liveblocks storage array
  const messages = useStorage((root) => root.messages) as any[] || [];
  const userInfo = useSelf((me) => me.info);

  const handleSend = useMutation(({ storage }, e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !userInfo) return;
    
    const messagesList = storage.get("messages") as any[];
    const newMessage = {
        id: Math.random().toString(36).substring(7),
        text: inputValue,
        sender: userInfo.name,
        color: userInfo.color,
        timestamp: Date.now(),
    };

    if (Array.isArray(messagesList)) {
      storage.set("messages", [...messagesList, newMessage]);
    } else {
      storage.set("messages", [newMessage]);
    }
    
    setInputValue("");
  }, [inputValue, userInfo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--dm-surface)",   }}>
      <div style={{ padding: "16px", borderBottom: "1px solid var(--dm-border)", display: "flex", alignItems: "center", gap: "8px" }}>
        <MessageSquare style={{ width: "18px", height: "18px", color: "#34d399" }} />
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--dm-text)" }}>In-call messages</h3>
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--dm-muted)", fontSize: "12px", background: "var(--dm-border2)", padding: "12px", borderRadius: "8px" }}>
            Messages sent here are visible to everyone in the call and will be deleted when the room ends.
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender === userInfo?.name;
            const showHeader = i === 0 || messages[i - 1]?.sender !== msg.sender;
            
            return (
              <div key={msg.id} style={{ alignSelf: "flex-start", maxWidth: "90%" }}>
                {showHeader && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", marginTop: i > 0 ? "8px" : "0" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: msg.color || "#34d399" }}>
                      {isMe ? "You" : msg.sender}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--dm-muted)" }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <div style={{ 
                  background: isMe ? "rgba(52,211,153,0.1)" : "var(--dm-border2)",
                  color: "var(--dm-text)", padding: "8px 12px", borderRadius: "8px",
                  fontSize: "13px", lineHeight: "1.5", wordBreak: "break-word",
                  border: isMe ? "1px solid rgba(52,211,153,0.2)" : "1px solid transparent" 
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: "16px", borderTop: "1px solid var(--dm-border)" }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message..."
            style={{
              flex: 1, background: "var(--dm-border2)", border: "1px solid var(--dm-border)",
              borderRadius: "20px", padding: "10px 16px", color: "var(--dm-text)", fontSize: "13px", outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            style={{
              background: inputValue.trim() ? "#34d399" : "var(--dm-border2)",
              color: inputValue.trim() ? "#0a0c12" : "var(--dm-muted)",
              border: "none", borderRadius: "50%", width: "38px", height: "38px",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: inputValue.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s"
            }}
          >
            <Send style={{ width: "16px", height: "16px", marginLeft: "-2px" }} />
          </button>
        </form>
      </div>
    </div>
  );
}
