"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabaseClient";

let mermaid;

const MODELS = [
  { name: "OpenAI GPT-4O Mini", value: "provider-3/gpt-4o-mini" },
  { name: "LLaMA 3.2 1B", value: "provider-6/llama-3.2-1b-instruct" },
  { name: "Gemma 3 4B IT", value: "provider-1/gemma-3-4b-it" },
  { name: "Gemini 2.5 Flash Lite", value: "provider-3/gemini-2.5-flash-lite-preview-09-2025" },
];

export default function NormalMode() {
  const router = useRouter();

  // --- State ---
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].value);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- Load Mermaid dynamically ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("mermaid")
      .then((mod) => {
        mermaid = mod.default;
        mermaid.initialize({ startOnLoad: false, theme: "dark" });
      })
      .catch(() => {});
  }, []);

  // --- Auth check ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  // --- Fetch sessions ---
  const fetchSessions = async () => {
    if (!user?.email) return;
    const { data, error } = await supabase
      .from("chat_history")
      .select("*")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchSessions error", error);
      return;
    }

    const sessionList = data || [];
    setSessions(sessionList);

    // Automatically select the most recent session
    if (sessionList.length > 0) {
      const recent = sessionList[0];
      setSessionId(recent.session_id);
      setMessages(recent.messages || []);
    } else {
      const tmp = crypto.randomUUID();
      setSessionId(tmp);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (user?.email) fetchSessions();
  }, [user?.email]);

  // --- Voice loading ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      let indianVoices = voices.filter(
        (v) => v.lang && v.lang.toLowerCase().startsWith("en-in")
      );
      if (indianVoices.length === 0) indianVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
      const list = indianVoices.length ? indianVoices : voices;
      setAvailableVoices(list);
      if (!selectedVoice && list.length) setSelectedVoice(list[0]);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    setTimeout(updateVoices, 300);
  }, [selectedVoice]);

  // --- Auto scroll ---
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading]);

  // --- New Chat ---
  const handleNewChat = async () => {
    const newSession = crypto.randomUUID();
    setSessionId(newSession);
    setMessages([]);

    const { data: inserted, error } = await supabase
      .from("chat_history")
      .insert([{ user_email: user.email, session_id: newSession, messages: [] }])
      .select();

    if (error) {
      console.error("handleNewChat insert error", error);
      setSessions((prev) => [{ user_email: user.email, session_id: newSession, messages: [] }, ...prev]);
      return;
    }

    const row = inserted?.[0] ?? { user_email: user.email, session_id: newSession, messages: [] };
    setSessions((prev) => [row, ...prev]);
  };

  // --- Select Session ---
  const selectSession = async (s) => {
    if (!s?.session_id) return;
    setSessionId(s.session_id);

    const { data, error } = await supabase
      .from("chat_history")
      .select("messages")
      .eq("session_id", s.session_id)
      .single();

    if (!error && data) setMessages(data.messages || []);
    else setMessages(s.messages || []);
  };

  // --- Save Chat ---
  const saveChat = async (sessId, msgs) => {
    if (!user?.email || !sessId) return;
    const { error } = await supabase.from("chat_history").upsert(
      [{ user_email: user.email, session_id: sessId, messages: msgs }],
      { onConflict: "session_id" }
    );
    if (error) console.error("saveChat error", error);
  };

  // --- Send Message ---
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const newMessage = { role: "user", content: input };
    const updated = [...messages, newMessage];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/normal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, model: selectedModel }),
      });
      const data = await res.json();
      const reply = data?.answer ?? "Sorry, no response.";
      const bot = { role: "assistant", content: reply };
      const final = [...updated, bot];

      setMessages(final);
      speakText(reply);
      await saveChat(sessionId, final);

      // update session list locally
      setSessions((prev) =>
        prev.map((sess) => (sess.session_id === sessionId ? { ...sess, messages: final } : sess))
      );
    } catch (err) {
      console.error("handleSend error", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: failed to get response." }]);
    } finally {
      setLoading(false);
    }
  };

  // --- Voice input ---
  const startListening = () => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition not supported.");
      return;
    }
    try {
      const rec = new window.webkitSpeechRecognition();
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.onresult = (ev) => setInput(ev.results[0][0].transcript);
      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.error("startListening error", err);
    }
  };

  // --- Voice output ---
  const speakText = (text) => {
    if (!text) return;
    let voiceToUse = selectedVoice || (availableVoices.length ? availableVoices[0] : null);
    if (!voiceToUse) return;

    window.speechSynthesis.cancel();
    const sanitized = text.replace(/```[\s\S]*?```/g, " code ").replace(/[*_`#]/g, "");
    const utt = new SpeechSynthesisUtterance(sanitized);
    utt.voice = voiceToUse;
    utt.lang = voiceToUse.lang || "en-IN";
    utt.onstart = () => setIsPaused(false);
    utt.onend = () => setIsPaused(false);
    window.speechSynthesis.speak(utt);
  };

  const togglePause = () => {
    if (!window.speechSynthesis.speaking) return;
    if (isPaused) window.speechSynthesis.resume();
    else window.speechSynthesis.pause();
    setIsPaused((s) => !s);
  };

  // --- Copy code ---
  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setToast("Copied!");
      setTimeout(() => setToast(null), 1500);
    });
  };

  // --- Render Mermaid ---
  const renderMermaid = (code, idx) => {
    if (!mermaid) return;
    try {
      mermaid.render(`graph-${idx}`, code, (svg) => {
        const el = document.getElementById(`mermaid-diagram-${idx}`);
        if (el) el.innerHTML = svg;
      });
    } catch (err) {
      console.error("mermaid render error", err);
    }
  };

  // --- Session Name ---
  const getSessionName = (session) => {
    if (!session) return "New Chat";
    const msgs = session.messages || [];
    const firstUser = msgs.find((m) => m.role === "user" && m.content?.trim()?.length > 0);
    if (firstUser) return firstUser.content.trim().slice(0, 48);
    if (session.created_at) return `Chat • ${new Date(session.created_at).toLocaleString()}`;
    return "New Chat";
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const MenuSvg = ({ open }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M4 6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );

  // --- Render ---
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 text-white">
      {/* Floating sidebar toggle */}
      <button
        aria-label={sidebarHidden ? "Open sidebar" : "Hide sidebar"}
        onClick={() => setSidebarHidden((s) => !s)}
        className="fixed left-2 top-1/3 z-50 rounded-full bg-gray-800 hover:bg-gray-700 p-2 shadow-lg text-white"
        style={{ width: 44, height: 44 }}
      >
        <MenuSvg open={!sidebarHidden} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-black shadow-lg z-40 w-64 p-4 flex flex-col transform transition-transform duration-200 ${
          sidebarHidden ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 relative">
            <Image src="/icon.png" alt="icon" fill sizes="32px" style={{ objectFit: "contain" }} />
          </div>
          <div className="text-lg font-bold text-purple-300 flex items-center gap-2">
            EduBot
          </div>
        </div>

        <div className="mb-3">
          <button onClick={handleNewChat} className="w-full bg-gray-700 px-3 py-2 rounded hover:bg-gray-600">
            🆕 New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm text-gray-400 mb-2">Conversation history</h4>
          {sessions.length === 0 && <p className="text-gray-500 text-sm">No chats yet</p>}
          {sessions.map((s) => (
            <div
              key={s.session_id}
              onClick={() => selectSession(s)}
              className={`cursor-pointer px-2 py-2 rounded mb-1 hover:bg-gray-700 ${
                s.session_id === sessionId ? "bg-gray-700" : ""
              }`}
            >
              <div className="text-sm truncate">{getSessionName(s)}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {s.created_at ? new Date(s.created_at).toLocaleString() : ""}
              </div>
            </div>
          ))}
        </div>

        {user && (
          <div className="border-t border-gray-700 pt-3 mt-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm truncate">{user.email}</div>
            </div>
            <button onClick={handleLogout} className="w-full bg-red-500 py-2 rounded hover:bg-red-600">
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className={`flex-1 flex flex-col ${sidebarHidden ? "ml-0" : "ml-64"} transition-all duration-200`}>
        <header className="flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur-md shadow z-30">
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <Image src="/icon.png" alt="logo" width={34} height={34} />
            </div>
            <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              Normal Mode
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedVoice?.name || ""}
              onChange={(e) => {
                const v = availableVoices.find((vv) => vv.name === e.target.value);
                if (v) setSelectedVoice(v);
              }}
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
            >
              {availableVoices.length === 0 ? (
                <option>Loading voices...</option>
              ) : (
                availableVoices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>

            <button onClick={() => router.push("/dashboard")} className="text-sm text-yellow-400 hover:underline">
              Back
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-gray-300 text-center mt-20">
              Ask EduBot anything — it will answer here.
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg max-w-2xl relative ${
                msg.role === "user" ? "bg-purple-600 ml-auto text-white" : "bg-gray-700 mr-auto text-white"
              }`}
            >
              {msg.role === "assistant" ? (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    children={msg.content}
                    components={{
                      code({ inline, children, ...props }) {
                        const codeContent = String(children).replace(/\n$/, "");
                        if (!inline && codeContent.startsWith("graph")) {
                          return (
                            <div className="mb-2">
                              <pre className="bg-black text-green-400 p-3 rounded-md overflow-x-auto text-sm">
                                <code {...props}>{codeContent}</code>
                              </pre>
                              <div
                                id={`mermaid-diagram-${i}`}
                                className="bg-[#0d1117] p-3 rounded-lg mt-2 overflow-x-auto text-center"
                              />
                              <button
                                onClick={() => renderMermaid(codeContent, i)}
                                className="mt-2 bg-yellow-500 text-black px-2 py-1 rounded hover:bg-yellow-600"
                              >
                                Render Diagram
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="relative group">
                            <pre className="bg-black text-green-400 p-3 rounded-md overflow-x-auto text-sm">
                              <code {...props}>{codeContent}</code>
                            </pre>
                            <button
                              onClick={() => copyCode(codeContent)}
                              className="absolute top-1 right-1 bg-gray-700 text-white text-xs px-2 py-1 rounded hover:bg-gray-600 opacity-80 group-hover:opacity-100 transition"
                            >
                              📋
                            </button>
                          </div>
                        );
                      },
                    }}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      onClick={() => speakText(msg.content)}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm"
                    >
                      🔊
                    </button>
                    <button
                      onClick={togglePause}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm"
                    >
                      {isPaused ? "▶️" : "⏸️"}
                    </button>
                  </div>
                </>
              ) : (
                <div>{msg.content}</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="p-3 rounded-lg max-w-lg bg-gray-600 mr-auto">EduBot is typing...</div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <form onSubmit={handleSend} className="p-4 bg-black flex gap-3 border-t border-gray-800 items-center">
          <button type="button" onClick={startListening} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">
            🎤
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none"
            placeholder="Ask EduBot..."
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition"
          >
            Send
          </button>
        </form>

        {toast && (
          <div className="fixed bottom-12 right-1/2 translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
