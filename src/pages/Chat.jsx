import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Plus, Loader2, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MessageBubble from '../components/chat/MessageBubble';

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const unsubRef = useRef(null);

  // Load conversations
  useEffect(() => {
    base44.agents.listConversations({ agent_name: 'openClawAgent' }).then((convs) => {
      setConversations(convs || []);
      if (convs && convs.length > 0) {
        loadConversation(convs[0].id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadConversation = async (convId) => {
    setLoading(true);
    if (unsubRef.current) unsubRef.current();
    const conv = await base44.agents.getConversation(convId);
    setActiveConv(conv);
    setMessages(conv.messages || []);
    setLoading(false);

    unsubRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      setMessages(data.messages || []);
    });
  };

  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: 'openClawAgent',
      metadata: { name: 'New Chat', description: '' },
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConv(conv);
    setMessages([]);

    if (unsubRef.current) unsubRef.current();
    unsubRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
    });
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: 'openClawAgent',
        metadata: { name: text.slice(0, 40), description: '' },
      });
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv);

      if (unsubRef.current) unsubRef.current();
      unsubRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
      });
    }

    await base44.agents.addMessage(conv, { role: 'user', content: text });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen">
      {/* Conversation List - Desktop */}
      <div className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50">
        <div className="p-4 border-b border-border">
          <Button
            onClick={createNewConversation}
            variant="outline"
            className="w-full gap-2 text-xs"
          >
            <Plus className="w-4 h-4" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate ${
                activeConv?.id === conv.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {conv.metadata?.name || 'Untitled'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-2 p-3 border-b border-border">
          <Button onClick={createNewConversation} variant="ghost" size="icon" className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground truncate">
            {activeConv?.metadata?.name || 'Emil'}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Moon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Emil</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Tell me your business goal and I'll start working on it by moonlight. I can research opportunities, create strategies, build content, and track revenue.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 md:px-8 border-t border-border bg-card/30 pb-20 md:pb-4">
          <div className="max-w-3xl mx-auto flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Give Emil a task..."
                rows={1}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
              size="icon"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}