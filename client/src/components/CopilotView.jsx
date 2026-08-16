import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, User, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { askCopilot } from '../utils/api';

const SUGGESTIONS = [
  "Which machine had the most downtime this week?",
  "What is the average OEE of our production lines?",
  "Identify any scrap rate anomalies.",
  "What are the current inventory levels?"
];

export default function CopilotView() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am your **MFGX AI Manufacturing Copilot**. I analyze factory telemetry from Line 1, Line 2, Line 3, and Line 4 to assist with shop-floor operations. \n\nAsk me questions about **OEE trends**, **downtime reasons**, **scrap rate spikes**, or **inventory levels**.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (textToSend) => {
    const query = textToSend.trim();
    if (!query) return;

    setInput('');
    setError(null);
    setIsSending(true);

    const userMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Map state messages to API history layout
      const history = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const response = await askCopilot(query, history);

      const botMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: response.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setError("Failed to communicate with the copilot. Please try again.");
      
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        sender: 'bot',
        text: "⚠️ **System Communication Failure**: I was unable to connect to the manufacturing AI endpoint. Please verify the backend server is running and `ANTHROPIC_API_KEY` is configured.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Convert markdown-style bold syntax `**text**` into actual HTML formatting
  const formatText = (text) => {
    if (!text) return '';
    
    // Simple markdown formatting helpers
    return text.split('\n').map((line, i) => {
      // Check for bullet lists
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      let cleanLine = isBullet ? line.replace(/^[\*\-]\s+/, '') : line;
      
      // Parse bold elements **text**
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex));
      }

      if (isBullet) {
        return (
          <li key={i} className="ml-5 list-disc mb-1 text-slate-700 text-sm leading-relaxed">
            {parts.length > 0 ? parts : cleanLine}
          </li>
        );
      }
      
      return (
        <p key={i} className="mb-2 text-slate-700 text-sm leading-relaxed min-h-[1rem]">
          {parts.length > 0 ? parts : cleanLine}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[600px] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4A6FA5]/10 text-[#4A6FA5]">
            <Cpu className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Shop-Floor Assistant</h3>
            <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Claude 3.5 Sonnet Connected
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm("Reset conversation history?")) {
              setMessages([
                {
                  id: 'welcome',
                  sender: 'bot',
                  text: "Hello! I am your **MFGX AI Manufacturing Copilot**. I analyze factory telemetry from Line 1, Line 2, Line 3, and Line 4 to assist with shop-floor operations. \n\nAsk me questions about **OEE trends**, **downtime reasons**, **scrap rate spikes**, or **inventory levels**.",
                  timestamp: new Date()
                }
              ]);
            }
          }}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          Reset Chat
        </button>
      </div>

      {/* Message Logs */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50/30">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-[85%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar Bubble */}
              <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg text-xs font-bold ${
                isBot 
                  ? 'bg-slate-100 text-[#4A6FA5] border border-slate-200' 
                  : 'bg-[#4A6FA5] text-white'
              }`}>
                {isBot ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className={`rounded-2xl px-4 py-3 shadow-xs border ${
                isBot 
                  ? 'bg-white border-slate-200 text-slate-800' 
                  : 'bg-[#EBF1FA] border-[#D1E0F2] text-slate-900'
              }`}>
                <div className="prose prose-sm max-w-none">
                  {formatText(msg.text)}
                </div>
                <span className="mt-1.5 block text-[9px] font-semibold text-slate-400 text-right leading-none">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* AI Typing loading indicator */}
        {isSending && (
          <div className="flex items-start gap-3 max-w-[85%]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#4A6FA5] border border-slate-200">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-xs flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions & Input Bar */}
      <div className="border-t border-slate-100 p-4 bg-white space-y-3">
        {/* Suggested Pills (horizontal scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2">
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(suggestion)}
              disabled={isSending}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 active:scale-95 transition-all duration-150 cursor-pointer min-h-[38px] flex items-center"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Text Input area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            placeholder="Ask MFGX AI about downtime, scrap, or OEE..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#4A6FA5] focus:outline-none disabled:bg-slate-50/50 disabled:text-slate-400 min-h-[44px]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4A6FA5] text-white shadow-xs hover:bg-[#3b5c8f] active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all duration-150 cursor-pointer min-h-[44px]"
          >
            <Send className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </form>
      </div>

    </div>
  );
}
