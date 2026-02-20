"use client";
import { useState, useRef, useEffect, useCallback, DragEvent } from "react";
import { rpcClient } from "@/core/ws/rpc-client";
import {
  Send,
  Loader2,
  MessagesSquare,
  Plus,
  MessageCircle,
  ChevronLeft,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Download,
} from "lucide-react";

interface Attachment {
  name: string;
  mimeType: string;
  dataUrl: string; // base64 data (without prefix for API, with prefix for display)
  size: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
  timestamp?: number;
}

interface ChatSession {
  key: string;
  label?: string;
  lastMessage?: string;
  updatedAt?: number;
}

function stripMetadata(text: string): string {
  return text
    .replace(/Conversation info \(untrusted metadata\):?\s*```json\s*\{[\s\S]*?\}\s*```\s*/g, "")
    .replace(/\[.*?\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+GMT[^\]]*\]\s*/g, "")
    .replace(/\[Dashboard chat —[^\]]*\]\s*/g, "")
    .replace(/\[System: This is a Dashboard chat session\.[^\]]*\]\s*/g, "")
    .trim();
}

interface ToolCall {
  name: string;
  args: string;
  result?: string;
}

function extractContent(content: any): { text: string; attachments: Attachment[]; toolCalls: ToolCall[] } {
  const attachments: Attachment[] = [];
  const toolCalls: ToolCall[] = [];
  let text = "";

  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    for (const block of content) {
      if (block.type === "text") {
        text += (text ? "\n" : "") + block.text;
      } else if (block.type === "image") {
        const src = block.source;
        if (src?.type === "base64") {
          attachments.push({
            name: "image",
            mimeType: src.media_type || "image/png",
            dataUrl: `data:${src.media_type || "image/png"};base64,${src.data}`,
            size: 0,
          });
        }
      } else if (block.type === "toolCall" || block.type === "tool_use") {
        const args = typeof block.arguments === "string" ? block.arguments : JSON.stringify(block.arguments || block.input || {});
        toolCalls.push({ name: block.name || "tool", args });
      } else if (block.type === "toolResult" || block.type === "tool_result") {
        // Try to find file paths in tool results
        const resultText = typeof block.content === "string" ? block.content :
          Array.isArray(block.content) ? block.content.map((b: any) => b.text || "").join("\n") : "";
        if (toolCalls.length > 0) {
          toolCalls[toolCalls.length - 1].result = resultText.slice(0, 500);
        }
        // Extract file paths from tool results too
        const paths = resultText.match(FILE_PATH_REGEX);
        if (paths) text += (text ? "\n" : "") + paths.join("\n");
      }
    }
  } else {
    text = JSON.stringify(content);
  }

  return { text: stripMetadata(text), attachments, toolCalls };
}

function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: reader.result as string,
        size: file.size,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const FILE_SERVER = "http://127.0.0.1:3457";
const FILE_SERVER_TOKEN = "d67aab65b5490d1f005a51a2f12fc12375ba64c23565f3011bfe36b9e75032f9";

// Detect file paths in message text
const FILE_PATH_REGEX = /(\/(?:Users|tmp|home|var|opt)[^\s"'`\])<>]+\.(?:pdf|png|jpg|jpeg|gif|webp|svg|html|txt|md|json|csv|xml|zip|mp3|mp4|wav|py|js|ts|tsx))/gi;

function detectFilePaths(text: string): string[] {
  const matches = text.match(FILE_PATH_REGEX);
  if (!matches) return [];
  return [...new Set(matches)];
}

function getFileUrl(filePath: string): string {
  return `${FILE_SERVER}/file?path=${encodeURIComponent(filePath)}`;
}

async function downloadFile(filePath: string) {
  const url = getFileUrl(filePath);
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${FILE_SERVER_TOKEN}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filePath.split("/").pop() || "file";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download file. Is the file server running?");
  }
}

function FileDownloadCard({ filePath }: { filePath: string }) {
  const name = filePath.split("/").pop() || "file";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isImage) {
      // Try to load image preview
      const url = getFileUrl(filePath);
      fetch(url, { headers: { Authorization: `Bearer ${FILE_SERVER_TOKEN}` } })
        .then((r) => r.ok ? r.blob() : null)
        .then((blob) => { if (blob) setPreviewUrl(URL.createObjectURL(blob)); })
        .catch(() => {});
    }
  }, [filePath]);

  return (
    <div className="my-2 inline-flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-xl hover:border-emerald-500/30 transition-colors group">
      {previewUrl ? (
        <img src={previewUrl} alt={name} className="w-10 h-10 rounded object-cover" />
      ) : (
        <div className="w-10 h-10 rounded bg-[#111] flex items-center justify-center">
          <FileText className="w-5 h-5 text-emerald-500" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium truncate max-w-[200px]">{name}</div>
        <div className="text-xs text-[#555] font-mono truncate max-w-[200px]">{filePath}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setLoading(true); downloadFile(filePath).finally(() => setLoading(false)); }}
        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors flex-shrink-0"
        title="Download"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Render message text with clickable file links
function MessageContent({ text }: { text: string }) {
  const filePaths = detectFilePaths(text);
  if (filePaths.length === 0) return <>{text}</>;

  // Remove file paths from text for cleaner display, then show download cards
  let cleanText = text;
  for (const fp of filePaths) {
    cleanText = cleanText.replace(fp, "").replace(/\s{2,}/g, " ");
  }
  cleanText = cleanText.trim();

  return (
    <>
      {cleanText && <div className="whitespace-pre-wrap">{cleanText}</div>}
      <div className="flex flex-col gap-1 mt-1">
        {filePaths.map((fp, i) => (
          <FileDownloadCard key={i} filePath={fp} />
        ))}
      </div>
    </>
  );
}

const LOCAL_SESSIONS_KEY = "openclaw-dashboard-chat-sessions";

function generateSessionKey(): string {
  return `dashboard-${crypto.randomUUID().slice(0, 8)}`;
}

function getLocalSessions(): ChatSession[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || "[]"); } catch { return []; }
}
function saveLocalSessions(sessions: ChatSession[]) {
  localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessions.slice(0, 100)));
}
function addLocalSession(session: ChatSession) {
  const existing = getLocalSessions();
  if (existing.some((s) => s.key === session.key)) return;
  saveLocalSessions([session, ...existing]);
}
function updateLocalSessionLabel(key: string, label: string) {
  const existing = getLocalSessions();
  const idx = existing.findIndex((s) => s.key === key);
  if (idx >= 0) { existing[idx].label = label; existing[idx].updatedAt = Date.now(); }
  saveLocalSessions(existing);
}

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string>(() => generateSessionKey());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(activeSession);

  activeRef.current = activeSession;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => { loadSessions(); addLocalSession({ key: activeSession, label: "New Chat", updatedAt: Date.now() }); }, []);
  useEffect(() => { loadHistory(activeSession); return () => { if (pollRef.current) clearTimeout(pollRef.current); }; }, [activeSession]);

  useEffect(() => {
    const unsub = rpcClient.on("chat", (data: any) => {
      if (!data || data.sessionKey !== activeRef.current) return;
      if (data.state === "final") { loadHistory(activeRef.current); setSending(false); }
    });
    return unsub;
  }, []);

  // Paste handler for images
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) fileToAttachment(file).then((a) => setAttachments((prev) => [...prev, a]));
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  async function handleFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) continue; // 20MB limit
      const attachment = await fileToAttachment(file);
      setAttachments((prev) => [...prev, attachment]);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  async function loadSessions() {
    try {
      const res: any = await rpcClient.request("sessions.list", { limit: 100 });
      const gw: ChatSession[] = (res?.sessions || [])
        .filter((s: any) => s.key?.startsWith("dashboard-"))
        .map((s: any) => ({ key: s.key, label: s.label || s.key, updatedAt: s.lastActivityAt || s.createdAt }));
      const local = getLocalSessions();
      const merged = new Map<string, ChatSession>();
      for (const s of local) merged.set(s.key, s);
      for (const s of gw) {
        const ex = merged.get(s.key);
        merged.set(s.key, { ...s, label: s.label && !s.label.startsWith("dashboard-") ? s.label : ex?.label || s.label });
      }
      const sorted = [...merged.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setSessions(sorted);
      saveLocalSessions(sorted);
    } catch { setSessions(getLocalSessions()); }
  }

  async function loadHistory(sessionKey: string) {
    setLoadingHistory(true);
    try {
      const res: any = await rpcClient.request("chat.history", { sessionKey, limit: 200 });
      const rawMsgs = res?.messages || [];
      const msgs: Message[] = [];
      
      for (let i = 0; i < rawMsgs.length; i++) {
        const m = rawMsgs[i];
        const { text, attachments: atts, toolCalls: tc } = extractContent(m.content);
        
        // Skip toolResult messages — fold results into previous assistant's toolCalls
        if (m.role === "tool" || (!m.role && !text && tc.length === 0)) {
          // Try to attach result to last assistant message's last tool call
          if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant" && msgs[msgs.length - 1].toolCalls?.length) {
            const lastTc = msgs[msgs.length - 1].toolCalls!;
            if (lastTc.length > 0 && !lastTc[lastTc.length - 1].result) {
              lastTc[lastTc.length - 1].result = text.slice(0, 500);
              // Also extract file paths from tool results
              const paths = text.match(FILE_PATH_REGEX);
              if (paths && !msgs[msgs.length - 1].content) {
                msgs[msgs.length - 1].content = paths.join("\n");
              }
            }
          }
          continue;
        }
        
        // Merge consecutive assistant messages (tool call chains)
        if (m.role === "assistant" && msgs.length > 0 && msgs[msgs.length - 1].role === "assistant" && !text) {
          // This is a continuation with more tool calls
          if (tc.length > 0) {
            const prev = msgs[msgs.length - 1];
            prev.toolCalls = [...(prev.toolCalls || []), ...tc];
            continue;
          }
        }
        
        msgs.push({
          role: m.role === "user" ? "user" : "assistant",
          content: text,
          attachments: atts.length > 0 ? atts : undefined,
          toolCalls: tc.length > 0 ? tc : undefined,
          timestamp: m.timestamp,
        });
      }
      setMessages(msgs);
    } catch { setMessages([]); }
    finally { setLoadingHistory(false); }
  }

  function handleNewChat() {
    const newKey = generateSessionKey();
    addLocalSession({ key: newKey, label: "New Chat", updatedAt: Date.now() });
    setActiveSession(newKey);
    setMessages([]);
    setInput("");
    setAttachments([]);
    setSending(false);
    if (pollRef.current) clearTimeout(pollRef.current);
    loadSessions();
    inputRef.current?.focus();
  }

  function handleSelectSession(key: string) {
    if (key === activeSession) return;
    setActiveSession(key);
    setAttachments([]);
    setSending(false);
    if (pollRef.current) clearTimeout(pollRef.current);
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  const handleSend = useCallback(async () => {
    const hasText = input.trim().length > 0;
    const hasFiles = attachments.length > 0;
    if ((!hasText && !hasFiles) || sending) return;

    const text = input.trim();
    const currentAttachments = [...attachments];
    setInput("");
    setAttachments([]);
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text || (currentAttachments.length > 0 ? `[${currentAttachments.map(a => a.name).join(", ")}]` : ""), attachments: currentAttachments.length > 0 ? currentAttachments : undefined, timestamp: Date.now() },
    ]);

    try {
      const label = text ? (text.length > 40 ? text.slice(0, 40) + "…" : text) : currentAttachments[0]?.name || "File upload";
      addLocalSession({ key: activeSession, label, updatedAt: Date.now() });
      updateLocalSessionLabel(activeSession, label);

      // Build attachments for API
      const apiAttachments = currentAttachments.map((a) => {
        const match = a.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return null;
        return { type: "image" as const, mimeType: match[1], content: match[2] };
      }).filter(Boolean);

      const idempotencyKey = crypto.randomUUID();
      const DASH_HINT = "[System: This is a Dashboard chat session. When creating files, ALWAYS include the full absolute file path in your final text response so the user can download them. Do NOT send files to Telegram or other channels. Return file paths here. Keep your response concise — tool output is shown separately.]";
      await rpcClient.request("chat.send", {
        sessionKey: activeSession,
        message: DASH_HINT + "\n\n" + (text || "See attached file(s)"),
        deliver: false,
        idempotencyKey,
        ...(apiAttachments.length > 0 ? { attachments: apiAttachments } : {}),
      });

      // Poll fallback
      const poll = async (attempt: number) => {
        if (attempt > 30) { setSending(false); return; }
        pollRef.current = setTimeout(async () => {
          try {
            const history: any = await rpcClient.request("chat.history", { sessionKey: activeRef.current, limit: 200 });
            const rawMsgs2 = history?.messages || [];
            const msgs: Message[] = [];
            for (let i = 0; i < rawMsgs2.length; i++) {
              const m = rawMsgs2[i];
              const { text: t, attachments: atts, toolCalls: tc } = extractContent(m.content);
              if (m.role === "tool" || (!m.role && !t && tc.length === 0)) {
                if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant" && msgs[msgs.length - 1].toolCalls?.length) {
                  const lastTc = msgs[msgs.length - 1].toolCalls!;
                  if (lastTc.length > 0 && !lastTc[lastTc.length - 1].result) lastTc[lastTc.length - 1].result = t.slice(0, 500);
                }
                continue;
              }
              if (m.role === "assistant" && msgs.length > 0 && msgs[msgs.length - 1].role === "assistant" && !t && tc.length > 0) {
                msgs[msgs.length - 1].toolCalls = [...(msgs[msgs.length - 1].toolCalls || []), ...tc];
                continue;
              }
              msgs.push({ role: m.role === "user" ? "user" : "assistant", content: t, attachments: atts.length > 0 ? atts : undefined, toolCalls: tc.length > 0 ? tc : undefined, timestamp: m.timestamp });
            }
            if (msgs[msgs.length - 1]?.role === "assistant") {
              setMessages(msgs);
              setSending(false);
              loadSessions();
              return;
            }
          } catch {}
          poll(attempt + 1);
        }, 2000);
      };
      poll(0);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err?.message || "Failed"}`, timestamp: Date.now() }]);
      setSending(false);
    }
  }, [input, sending, activeSession, attachments]);

  function getPreview(session: ChatSession): string {
    return session.label && !session.label.startsWith("dashboard-") ? session.label : session.key.replace("dashboard-", "Chat ");
  }

  return (
    <div
      className={`flex h-[calc(100vh-8rem)] gap-0 -mx-6 lg:-mx-8 -my-0 ${dragOver ? "ring-2 ring-emerald-500/50 ring-inset" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.json,.csv,.html,.xml,.py,.js,.ts,.tsx,.jsx"
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
      />

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-200 overflow-hidden border-r border-[#1a1a1a] bg-[#0a0a0a] flex-shrink-0 flex flex-col`}>
        <div className="p-3 border-b border-[#1a1a1a]">
          <button onClick={handleNewChat} className="w-full flex items-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 ? (
            <p className="text-[#555] text-xs text-center py-4">No chats yet</p>
          ) : sessions.map((s) => (
            <button key={s.key} onClick={() => handleSelectSession(s.key)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate flex items-center gap-2 ${s.key === activeSession ? "bg-emerald-500/10 text-emerald-400" : "text-[#888] hover:text-white hover:bg-[#111]"}`}>
              <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{getPreview(s)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-[#111] text-[#888] hover:text-white transition-colors">
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <MessagesSquare className="w-4 h-4" />}
          </button>
          <span className="text-sm text-[#888] font-mono truncate">{activeSession}</span>
        </div>

        {/* Drop overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center pointer-events-none">
            <div className="bg-[#111] border-2 border-dashed border-emerald-500 rounded-2xl px-8 py-6 text-center">
              <Paperclip className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-emerald-400 font-medium">Drop files here</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#555]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-[#888]">
                <MessagesSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Send a message or drop files to start</p>
              </div>
            </div>
          ) : messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl text-sm ${msg.role === "user" ? "bg-emerald-600 text-white rounded-br-sm" : "bg-[#111] border border-[#222] rounded-bl-sm"}`}>
                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="p-2 space-y-2">
                    {msg.attachments.map((att, j) => (
                      att.mimeType.startsWith("image/") ? (
                        <img key={j} src={att.dataUrl} alt={att.name} className="max-w-full max-h-64 rounded-lg" />
                      ) : (
                        <div key={j} className="flex items-center gap-2 px-3 py-2 bg-black/20 rounded-lg">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs truncate">{att.name}</span>
                          {att.size > 0 && <span className="text-xs opacity-60">{formatFileSize(att.size)}</span>}
                        </div>
                      )
                    ))}
                  </div>
                )}
                {/* Tool calls */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="px-4 py-2 space-y-1.5">
                    {msg.toolCalls.map((tc, j) => {
                      let argPreview = "";
                      try {
                        const parsed = JSON.parse(tc.args);
                        argPreview = parsed.command || parsed.query || parsed.message || parsed.path || parsed.url || tc.args.slice(0, 80);
                      } catch { argPreview = tc.args.slice(0, 80); }
                      return (
                        <details key={j} className="group">
                          <summary className="flex items-center gap-2 text-xs text-[#666] cursor-pointer hover:text-[#999] transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
                            <span className="font-mono font-medium text-blue-400/80">{tc.name}</span>
                            <span className="truncate max-w-[300px] opacity-60">{argPreview}</span>
                          </summary>
                          <div className="mt-1 ml-3.5 text-[10px] font-mono text-[#555] bg-black/30 rounded-lg p-2 max-h-32 overflow-auto whitespace-pre-wrap">
                            {tc.args}
                            {tc.result && <><br/><span className="text-emerald-500/60">→ {tc.result}</span></>}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
                {msg.content && (
                  <div className="px-4 py-3">
                    {msg.role === "assistant" ? <MessageContent text={msg.content} /> : <span className="whitespace-pre-wrap">{msg.content}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-[#111] border border-[#222] px-4 py-3 rounded-xl rounded-bl-sm">
                <Loader2 className="w-4 h-4 animate-spin text-[#888]" />
              </div>
            </div>
          )}
        </div>

        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-[#1a1a1a] flex gap-2 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                {att.mimeType.startsWith("image/") ? (
                  <img src={att.dataUrl} alt={att.name} className="h-16 w-16 object-cover rounded-lg border border-[#222]" />
                ) : (
                  <div className="h-16 w-16 flex flex-col items-center justify-center rounded-lg border border-[#222] bg-[#111]">
                    <FileText className="w-5 h-5 text-[#888]" />
                    <span className="text-[9px] text-[#555] mt-0.5 truncate max-w-[56px]">{att.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[#1a1a1a] px-4 py-4">
          <div className="flex gap-2 items-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl hover:bg-[#111] text-[#888] hover:text-white transition-colors"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message or drop files..."
              className="flex-1 px-4 py-3 bg-[#111] border border-[#222] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-emerald-500/50 text-sm"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || (!input.trim() && attachments.length === 0)}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
