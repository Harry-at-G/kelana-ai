"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { askKelana, type Source } from "../../services/askService";
import { useAuthGuard } from "../../hooks/useAuthGuard";

const SUGGESTED = [
  "Can I bring medication into Japan?",
  "What are the best travel tips for Kyoto?",
  "What should I pack for a trip to Bali?",
  "How do I get around in Singapore?",
];

export default function AssistantPage() {
  useAuthGuard();

  const [input,   setInput]   = useState("");
  const [answer,  setAnswer]  = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [asked,   setAsked]   = useState("");

  async function handleAsk(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setAnswer(null);
    setSources([]);
    setError(null);
    setAsked(question);

    try {
      const res = await askKelana(question);
      setAnswer(res.answer);
      setSources(res.sources ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleAsk(input);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl flex flex-col gap-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ask KelanaAI</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Powered by your trusted travel documents
          </p>
        </div>

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Can I bring medication into Japan?"
            disabled={busy}
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-teal-300 shadow-sm disabled:opacity-50 italic placeholder:not-italic"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl px-5 py-3 text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            {busy ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            ) : (
              <>Ask <span>▶</span></>
            )}
          </button>
        </form>

        {/* Suggested questions */}
        {!answer && !busy && !error && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); handleAsk(q); }}
                  className="text-sm bg-white border border-gray-200 hover:border-teal-400 hover:text-teal-600 text-gray-500 rounded-full px-4 py-1.5 transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            😕 {error}
          </div>
        )}

        {/* Answer card */}
        {(answer || busy) && (
          <div className="bg-teal-600 text-white rounded-2xl overflow-hidden shadow-sm">

            {/* AI Answer section */}
            <div className="px-5 py-4">
              <p className="text-xs font-bold tracking-widest uppercase text-teal-200 mb-2">
                AI Answer
              </p>
              {busy ? (
                <div className="flex items-center gap-1.5 py-1">
                  <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-white">
                  <ReactMarkdown
                    components={{
                      p:      ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul:     ({ children }) => <ul className="list-disc pl-4 mt-1 flex flex-col gap-0.5">{children}</ul>,
                      li:     ({ children }) => <li>{children}</li>,
                    }}
                  >
                    {answer ?? ""}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Sources section */}
            {sources.length > 0 && (
              <>
                <div className="border-t border-teal-500 mx-5" />
                <div className="px-5 py-4">
                  <p className="text-xs font-bold tracking-widest uppercase text-teal-200 mb-2">
                    Source
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors group"
                        title={src.uri}
                      >
                        <span className="text-teal-300 shrink-0">▤</span>
                        <span className="font-mono text-xs group-hover:underline truncate">
                          {src.title || src.uri.split("/").pop() || "Source"}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
