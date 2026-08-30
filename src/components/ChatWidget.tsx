"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Minimize2, Sparkles } from 'lucide-react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: "Hi! I'm JobOS AI. How can I help you stop ghosting your customers today? You can chat with me here or email us directly at contact@JobOS.com.au" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const userMsg = { id: messages.length + 1, sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    
    setTimeout(() => {
      const aiMsg = { 
        id: messages.length + 2, 
        sender: 'ai', 
        text: "Thanks for your message! Our team will get back to you soon. In the meantime, feel free to email contact@JobOS.com.au." 
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#F59E0B] text-black flex items-center justify-center shadow-2xl hover:scale-105 transition-transform active:scale-95 border-2 border-bg-card"
            aria-label="Open JobOS Chat"
          >
            {/* Grok-style Animated Eyes */}
            <div className="flex items-center gap-1.5 animate-look-around">
              <div className="w-1.5 h-3.5 bg-black rounded-full animate-grok-blink" />
              <div className="w-1.5 h-3.5 bg-black rounded-full animate-grok-blink" />
            </div>
            
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-bg-card"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[85vh] bg-bg-card border border-border-light rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="h-16 border-b border-border-light flex items-center justify-between px-4 bg-bg-secondary shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B] text-black flex items-center justify-center font-black text-xs shadow-sm">
                  JOS
                </div>
                <div>
                  <h3 className="text-text-heading font-bold text-sm">JobOS Support</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <button onClick={() => setIsOpen(false)} className="p-2 hover:text-text-charcoal transition-colors hover:bg-bg-hover rounded-lg">
                  <Minimize2 size={18} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-main scroll-smooth">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-text-heading text-bg-main rounded-tr-sm' 
                        : 'bg-bg-secondary border border-border-light text-text-charcoal rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="flex items-center gap-1.5 mb-1 text-[#F59E0B]">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">JobOS AI</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border-light bg-bg-secondary shrink-0">
              <div className="relative flex items-center">
                <button className="absolute left-3 text-text-muted hover:text-text-charcoal transition-colors">
                  <Paperclip size={18} />
                </button>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about pricing, features, or setup..."
                  className="w-full bg-bg-input border border-border-light rounded-xl py-3 pl-10 pr-12 text-sm text-text-charcoal focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="absolute right-2 p-1.5 bg-[#F59E0B] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FBBF24] transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-text-muted font-medium">Powered by Grok technology</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
