import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink } from 'lucide-react';
import { askChat, type ChatSource } from '@/lib/api';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: Date;
}

export function ChatbotTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your AI policy research assistant. Ask me anything about AI ethics regulations, compliance requirements, or policies from around the world.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await askChat(question);
      const aiMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check that the backend is running and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMessage]);
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
      <div className="mb-4">
        <h2 className="text-2xl">Policy Assistant</h2>
        <p className="text-sm text-gray-600 mt-1">
          Ask questions about AI regulations and compliance requirements
        </p>
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
