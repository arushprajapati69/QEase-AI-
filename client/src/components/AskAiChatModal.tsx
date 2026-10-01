import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, Coffee, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { apiAskAi } from '../lib/api';

interface AskAiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  tokenNumber: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recommendedAction?: 'STAY_NEARBY' | 'CAN_LEAVE' | 'RETURN_IMMEDIATELY';
  suggestedReturnTimestamp?: string;
  timestamp: string;
}

export const AskAiChatModal: React.FC<AskAiChatModalProps> = ({
  isOpen,
  onClose,
  tokenId,
  tokenNumber,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Hello! I'm your QEase AI assistant for Token #${tokenNumber}. Ask me anything about your wait, documents, or whether you can step out!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setIsLoading(true);

    try {
      const res = await apiAskAi(tokenId, textToSend);
      if (res.success && res.data) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.data.answer,
          recommendedAction: res.data.recommendedAction,
          suggestedReturnTimestamp: res.data.suggestedReturnTimestamp,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(res.message || 'Failed to fetch AI response');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: err.message || 'Unable to connect to AI engine right now. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeStyle = (action?: string) => {
    switch (action) {
      case 'CAN_LEAVE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'RETURN_IMMEDIATELY':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'STAY_NEARBY':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div className="w-full sm:max-w-lg bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[620px] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Ask QEase AI</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Contextual Assistant for Token #{tokenNumber}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Warning Notice */}
        <div className="bg-brand-950/40 border-b border-brand-900/50 px-4 py-2 text-[11px] text-brand-300 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span>Never share sensitive numeric ID digits. We only assist with generic document types.</span>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.text}

                {msg.recommendedAction && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${getBadgeStyle(
                        msg.recommendedAction
                      )}`}
                    >
                      {msg.recommendedAction.replace('_', ' ')}
                    </span>

                    {msg.suggestedReturnTimestamp && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-brand-400" /> Return by ~{msg.suggestedReturnTimestamp}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs p-3 bg-slate-800/50 rounded-2xl max-w-[200px] border border-slate-700/50 animate-pulse">
              <Sparkles className="w-4 h-4 text-brand-400 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Preset Quick Query Suggestions */}
        <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleSend('Can I step out for coffee or lunch?')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-300 whitespace-nowrap flex items-center gap-1.5 transition-colors"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" /> Can I go for lunch?
          </button>
          <button
            type="button"
            onClick={() => handleSend('What documents do I need to present?')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-300 whitespace-nowrap transition-colors"
          >
            Required Documents?
          </button>
          <button
            type="button"
            onClick={() => handleSend('When should I return to the branch?')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-300 whitespace-nowrap transition-colors"
          >
            Return Time?
          </button>
        </div>

        {/* Chat Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI about wait time, mobility, docs..."
            className="flex-1 bg-slate-900/80 border border-white/10 focus:border-brand-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:opacity-50 text-white transition-all shadow-md shadow-brand-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
