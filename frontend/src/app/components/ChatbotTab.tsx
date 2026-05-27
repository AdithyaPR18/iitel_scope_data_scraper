import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, RotateCcw, Download } from 'lucide-react';
import { askChat, fetchChatHistory, type ChatSource } from '@/lib/api';
import { useAuth } from '@/app/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: Date;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your AI policy research assistant. Ask me anything about AI ethics regulations, compliance requirements, or policies from around the world.",
  timestamp: new Date(),
};

export function ChatbotTab() {
  const { user, sessionId, newSession } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat history for the current session on mount
  useEffect(() => {
    if (!user || historyLoaded) return;
    fetchChatHistory()
      .then((res) => {
        if (res.data.length === 0) return;
        const historical: Message[] = res.data.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources ?? undefined,
          timestamp: new Date(m.created_at),
        }));
        setMessages([WELCOME, ...historical]);
      })
      .catch(() => {
        // Silently fall back — history is a nice-to-have
      })
      .finally(() => setHistoryLoaded(true));
  }, [user, historyLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    newSession();
    setMessages([WELCOME]);
    setHistoryLoaded(true); // don't reload history after explicit new chat
  };

  const handleSavePdf = () => {
    const exportable = messages.filter((m) => m.id !== 'welcome');
    if (exportable.length === 0) return;

    const rows = exportable.map((m) => {
      const role = m.role === 'user' ? 'You' : 'AI Assistant';
      const time = m.timestamp.toLocaleString();
      const sourcesHtml =
        m.sources && m.sources.length > 0
          ? `<div class="sources">Sources: ${m.sources
              .map((s) =>
                s.url
                  ? `<a href="${s.url}" target="_blank">${s.title || s.source}</a>`
                  : s.title || s.source
              )
              .join(', ')}</div>`
          : '';
      return `
        <div class="msg ${m.role}">
          <div class="meta"><strong>${role}</strong> &nbsp;·&nbsp; <span class="time">${time}</span></div>
          <div class="body">${m.content.replace(/\n/g, '<br>')}</div>
          ${sourcesHtml}
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Policy Assistant Chat</title>
      <style>
        body{font-family:Arial,sans-serif;max-width:820px;margin:40px auto;color:#1a1a1a;line-height:1.6}
        h1{font-size:20px;margin-bottom:4px}p.sub{color:#666;font-size:13px;margin:0 0 28px}
        .msg{margin-bottom:18px;padding:14px 18px;border-radius:10px}
        .user{background:#f5ebe0}.assistant{background:#f0f0f0}
        .meta{font-size:12px;color:#555;margin-bottom:6px}
        .time{color:#888}.body{font-size:14px}
        .sources{font-size:12px;color:#777;margin-top:8px}
        .sources a{color:#b8854f;text-decoration:none}
        @media print{body{margin:20px}}
      </style></head><body>
      <h1>Policy Assistant Chat Export</h1>
      <p class="sub">Exported on ${new Date().toLocaleString()}</p>
      ${rows}
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400); // small delay so styles apply before print dialog
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await askChat(question, user ? sessionId : undefined);
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check that the backend is running and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Policy Assistant</h2>
          <p className="text-sm text-gray-600 mt-1">
            Ask questions about AI regulations and compliance requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSavePdf}
            disabled={messages.filter((m) => m.id !== 'welcome').length === 0}
            title="Save chat as PDF"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Save PDF
          </button>
          <button
            onClick={handleNewChat}
            title="Start a new chat"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <RotateCcw className="w-4 h-4" />
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#C9A961] flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="max-w-[70%] space-y-2">
              <div
                className={`rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-[#C9A961] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <span
                  className={`text-xs mt-2 block ${
                    message.role === 'user' ? 'text-white/80' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="text-xs text-gray-500 space-y-1 pl-1">
                  <p className="font-medium text-gray-600">Sources used:</p>
                  {message.sources.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-[#C9A961] truncate"
                        >
                          {s.title || s.source}
                        </a>
                      ) : (
                        <span>{s.title || s.source}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#C9A961] flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            placeholder="Ask about AI policies, compliance requirements..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A961] disabled:bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-[#C9A961] text-white rounded-lg hover:bg-[#B8984F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
