import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, ChevronDown, ChevronRight, Wrench, Loader2, AlertCircle } from 'lucide-react';
import { aiSearchService, AgentResponse, AgentStep } from '../services/aiSearchService';

interface Message {
  role: 'user' | 'agent';
  content: string;
  steps?: AgentStep[];
  isLoading?: boolean;
  error?: boolean;
}

interface AgentChatPanelProps {
  initialQuery?: string;
}

export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({ initialQuery }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-submit initial query if provided
  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
    }
  }, [initialQuery]);

  const toggleSteps = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const sendMessage = async (queryOverride?: string) => {
    const query = queryOverride ?? input.trim();
    if (!query || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setMessages(prev => [...prev, { role: 'agent', content: '', isLoading: true }]);
    setIsLoading(true);

    try {
      const result: AgentResponse = await aiSearchService.chatWithAgent(query, sessionId);
      if (result.session_id) setSessionId(result.session_id);

      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'agent', content: result.answer, steps: result.steps },
      ]);
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'agent', content: 'The agent service is currently unavailable. Make sure the Python AI service is running.', error: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[420px]">
      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
          <Bot className="w-10 h-10 text-purple-500 opacity-60" />
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
            Ask the agent multi-step research questions — it can search patents, check NFT status, and analyse claims.
          </p>
          <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-2">
            {[
              'Find unminted AI patents in healthcare from 2022',
              'Which battery patents are most valuable to mint?',
              'Find prior art for quantum error correction',
            ].map(prompt => (
              <button key={prompt} onClick={() => sendMessage(prompt)}
                className="text-left text-xs px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message thread */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-4 p-3">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'agent' && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap
                    ${msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : msg.error
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100'}`}>
                    {msg.isLoading ? (
                      <span className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
                      </span>
                    ) : msg.error ? (
                      <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{msg.content}</span>
                    ) : msg.content}
                  </div>

                  {/* Tool call accordion */}
                  {msg.steps && msg.steps.length > 0 && (
                    <button onClick={() => toggleSteps(i)}
                      className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-purple-500 transition-colors">
                      {expandedSteps.has(i) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <Wrench className="w-3 h-3" />
                      {msg.steps.length} tool call{msg.steps.length !== 1 ? 's' : ''}
                    </button>
                  )}
                  <AnimatePresence>
                    {expandedSteps.has(i) && msg.steps && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-1 space-y-1">
                          {msg.steps.map((step, si) => (
                            <div key={si} className="text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2.5 py-1.5">
                              <span className="font-mono text-purple-600 dark:text-purple-400">{step.tool}</span>
                              <span className="text-gray-500 mx-1">←</span>
                              <span className="text-gray-600 dark:text-gray-400 line-clamp-1">{step.input}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} disabled={isLoading}
            placeholder="Ask the agent anything about patents…"
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50" />
          <button type="submit" disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
        {sessionId && (
          <p className="text-xs text-gray-400 mt-1.5 text-center">
            Session active — the agent remembers context from this conversation
          </p>
        )}
      </div>
    </div>
  );
};

export default AgentChatPanel;
