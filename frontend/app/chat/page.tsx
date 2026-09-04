"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import {
  createConversation,
  listConversations,
  getConversation,
  sendMessage,
  type Conversation,
  type ChatMessage,
  type Source,
  type TripPlan,
} from "../../services/chatService";
import { createTrip } from "../../services/tripService";

export default function ChatPage() {
  useAuthGuard();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv,    setActiveConv]    = useState<Conversation | null>(null);
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [input,         setInput]         = useState("");
  const [busy,          setBusy]          = useState(false);
  const [newTitle,      setNewTitle]      = useState("");
  const [showNewForm,   setShowNewForm]   = useState(false);
  const [sidebarError,  setSidebarError]  = useState<string | null>(null);
  const [chatError,     setChatError]     = useState<string | null>(null);
  const [savingId,      setSavingId]      = useState<number | null>(null);
  const [savedIds,      setSavedIds]      = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadConversations() {
    try {
      setConversations(await listConversations());
    } catch (err: unknown) {
      setSidebarError(err instanceof Error ? err.message : "Failed to load conversations.");
    }
  }

  async function handleSelectConversation(conv: Conversation) {
    setChatError(null);
    setActiveConv(conv);
    try {
      const full = await getConversation(conv.id);
      setActiveConv(full);
      setMessages(full.messages ?? []);
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : "Failed to load messages.");
    }
  }

  async function handleCreateConversation(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const conv = await createConversation(newTitle.trim());
      setConversations((prev) => [conv, ...prev]);
      setNewTitle("");
      setShowNewForm(false);
      handleSelectConversation(conv);
    } catch (err: unknown) {
      setSidebarError(err instanceof Error ? err.message : "Failed to create conversation.");
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy || !activeConv) return;

    const userMsg: ChatMessage = {
      id: Date.now(), role: "user", content: input.trim(),
      created_at: new Date().toISOString(),
    };
    const loadingMsg: ChatMessage = {
      id: Date.now() + 1, role: "assistant", content: "",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setBusy(true);
    setChatError(null);

    try {
      const reply = await sendMessage(activeConv.id, userMsg.content);
      setMessages((prev) => [...prev.slice(0, -1), reply]);
    } catch (err: unknown) {
      setMessages((prev) => prev.slice(0, -1));
      setChatError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTrip(msgId: number, plan: TripPlan) {
    setSavingId(msgId);
    try {
      await createTrip({
        destination:  plan.destination,
        days:         plan.days,
        budget:       plan.budget,
        travel_style: plan.travel_style,
      });
      setSavedIds((prev) => new Set(prev).add(msgId));
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : "Failed to save trip.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="flex h-[calc(100vh-56px)] bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-bold text-gray-800 text-sm">Topics</span>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="w-7 h-7 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center text-lg leading-none transition-colors"
            title="New topic"
          >+</button>
        </div>

        {showNewForm && (
          <form onSubmit={handleCreateConversation} className="px-3 py-3 border-b border-gray-100 flex gap-2">
            <input
              autoFocus value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Topic name…"
              className="flex-1 text-sm bg-gray-100 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button type="submit" disabled={!newTitle.trim()}
              className="text-xs bg-blue-400 hover:bg-blue-500 disabled:bg-blue-200 text-white rounded-lg px-2.5 py-1.5 font-semibold transition-colors">
              Add
            </button>
          </form>
        )}

        {sidebarError && <p className="text-xs text-red-500 px-4 py-2">{sidebarError}</p>}

        <div className="flex-1 overflow-y-auto py-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3 text-center">No topics yet. Click + to create one.</p>
          ) : conversations.map((conv) => (
            <button key={conv.id} onClick={() => handleSelectConversation(conv)}
              className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 transition-colors ${
                activeConv?.id === conv.id ? "bg-blue-50 border-r-2 border-blue-400" : "hover:bg-gray-50"
              }`}>
              <span className={`text-sm font-medium truncate ${activeConv?.id === conv.id ? "text-blue-600" : "text-gray-700"}`}>
                {conv.title}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(conv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Chat window ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-2">
          {activeConv ? (
            <>
              <span className="text-sm font-bold text-gray-800 truncate">{activeConv.title}</span>
              <span className="text-xs text-gray-400 ml-1">· {messages.length} message{messages.length !== 1 ? "s" : ""}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Select a topic or create a new one</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {!activeConv && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <span className="text-5xl">💬</span>
              <p className="text-gray-500 text-sm font-medium">Create a topic on the left to start chatting with KelanaAI.</p>
              <p className="text-xs text-gray-400 max-w-xs">
                💡 Try asking: <em>&quot;Plan a 5-day trip to Bali for USD 2000 in a relaxed style&quot;</em>
              </p>
            </div>
          )}

          {activeConv && messages.length === 0 && !busy && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <span className="text-4xl">✈️</span>
              <p className="text-gray-400 text-sm">Ask anything about travel, or ask me to plan a trip!</p>
              <p className="text-xs text-gray-300 max-w-xs mt-1">
                Try: <em>&quot;Plan a 5-day trip to Tokyo for USD 3000 with cultural style&quot;</em>
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id ?? i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs shrink-0 mt-0.5">✈️</div>
              )}

              <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end max-w-[75%]" : "items-start max-w-[85%]"}`}>
                {/* Message bubble */}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed w-full ${
                  msg.role === "user"
                    ? "bg-blue-400 text-white rounded-br-sm"
                    : "bg-white shadow-sm text-gray-700 rounded-bl-sm"
                }`}>
                  {msg.role === "assistant" && msg.content === "" ? (
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  ) : msg.role === "assistant" ? (
                    <>
                      <ReactMarkdown components={{
                        p:      ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        h1:     ({ children }) => <p className="text-sm font-bold text-blue-500 mb-2">{children}</p>,
                        h2:     ({ children }) => <p className="text-sm font-bold text-blue-500 mb-2">{children}</p>,
                        h3:     ({ children }) => <p className="text-sm font-bold text-gray-800 mt-2 mb-1">{children}</p>,
                        ul:     ({ children }) => <ul className="list-disc pl-4 mt-1 flex flex-col gap-0.5">{children}</ul>,
                        li:     ({ children }) => <li>{children}</li>,
                      }}>{msg.content}</ReactMarkdown>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
                          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">📚 Sources</span>
                          {msg.sources.map((src: Source, si: number) => (
                            <a key={si} href={src.uri} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline truncate" title={src.uri}>
                              {src.title || src.uri.split("/").pop() || "Source"}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : msg.content}
                </div>

                {/* Trip Plan card — shown below the assistant bubble */}
                {msg.trip_plan && (
                  <TripPlanCard
                    plan={msg.trip_plan}
                    saved={savedIds.has(msg.id)}
                    saving={savingId === msg.id}
                    onSave={() => handleSaveTrip(msg.id, msg.trip_plan!)}
                    onView={() => router.push("/trips")}
                  />
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs shrink-0 mt-0.5">👤</div>
              )}
            </div>
          ))}

          {chatError && <p className="text-xs text-red-500 text-center">{chatError}</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="bg-white border-t border-gray-100 px-4 py-3 flex gap-2">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={activeConv ? "Ask about travel or plan a trip…" : "Select a topic first…"}
            disabled={!activeConv || busy}
            className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
          />
          <button type="submit" disabled={!activeConv || !input.trim() || busy}
            className="bg-blue-400 hover:bg-blue-500 disabled:bg-blue-200 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shrink-0">
            Send
          </button>
        </form>
      </div>
    </main>
  );
}

// ── Trip Plan Card ────────────────────────────────────────────────────────────

function TripPlanCard({
  plan, saved, saving, onSave, onView,
}: {
  plan:    TripPlan;
  saved:   boolean;
  saving:  boolean;
  onSave:  () => void;
  onView:  () => void;
}) {
  return (
    <div className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🗺️</span>
        <span className="text-sm font-bold text-blue-600">Trip Plan Generated</span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white rounded-xl px-3 py-2 flex flex-col gap-0.5">
          <span className="text-gray-400 uppercase tracking-wider font-semibold">Destination</span>
          <span className="font-bold text-gray-700">{plan.destination}</span>
        </div>
        <div className="bg-white rounded-xl px-3 py-2 flex flex-col gap-0.5">
          <span className="text-gray-400 uppercase tracking-wider font-semibold">Duration</span>
          <span className="font-bold text-gray-700">{plan.days} days</span>
        </div>
        <div className="bg-white rounded-xl px-3 py-2 flex flex-col gap-0.5">
          <span className="text-gray-400 uppercase tracking-wider font-semibold">Budget</span>
          <span className="font-bold text-gray-700">USD {plan.budget.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-xl px-3 py-2 flex flex-col gap-0.5">
          <span className="text-gray-400 uppercase tracking-wider font-semibold">Style</span>
          <span className="font-bold text-gray-700">{plan.travel_style}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {saved ? (
          <button onClick={onView}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl py-2 transition-colors">
            ✓ Saved — View in My Trips →
          </button>
        ) : (
          <button onClick={onSave} disabled={saving}
            className="flex-1 bg-blue-400 hover:bg-blue-500 disabled:bg-blue-200 text-white text-xs font-semibold rounded-xl py-2 transition-colors">
            {saving ? "Saving…" : "💾 Save to My Trips"}
          </button>
        )}
      </div>
    </div>
  );
}
