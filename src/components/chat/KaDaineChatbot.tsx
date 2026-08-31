import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { sendChatMessage } from '#/server/aiChat';
import { Button } from '#/components/ui/button'; // Assuming standard Shadcn-like components exist, if not I will use simple html elements, but usually UI lib is present
import { cn } from '#/lib/utils'; // standard shadcn utils, let's use raw tailwind just in case

type Role = 'user' | 'model';

interface Message {
  role: Role;
  text: string;
}

const SUGGESTED_PROMPTS = [
  "How do I request a Barangay Clearance?",
  "Who is the Barangay Captain?",
  "Where is the nearest evacuation center?",
  "Emergency Hotlines",
];

export function KaDaineChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [clientId, setClientId] = useState<string>('anon');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('ka_daine_client_id');
      if (!id) {
        id = 'resident_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('ka_daine_client_id', id);
      }
      setClientId(id);
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: text.trim() };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      const validHistory = messages
        .filter((m) => m.text && !m.text.startsWith('Pasensya na po'))
        .slice(-6);

      const response = await sendChatMessage({
        data: {
          message: text.trim(),
          clientId,
          history: validHistory,
        },
      });

      if (response && response.text) {
        setMessages([...currentMessages, { role: 'model', text: response.text }]);
      } else {
        throw new Error('Empty response from assistant');
      }
    } catch (error: any) {
      console.error('Ka-Daine chat error:', error);
      setMessages([
        ...currentMessages,
        {
          role: 'model',
          text: error?.message?.includes('Rate limit')
            ? error.message
            : "Pasensya na po, nagkaroon ng pansamantalang error sa connection. Pakiusap pong sumubok muli.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 group focus:outline-none focus:ring-4 focus:ring-primary/30"
          title="Chat with Ka-Daine AI Resident Assistant"
          aria-label="Chat with Ka-Daine AI Resident Assistant"
          aria-expanded={false}
        >
          <MessageCircle className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full p-1 shadow-sm">
            <Sparkles className="w-3 h-3" />
          </div>
          <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1 bg-white text-gray-800 text-sm font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap dark:bg-gray-800 dark:text-gray-200">
            Chat with Ka-Daine
          </div>
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label="Ka-Daine AI Resident Assistant Chat"
          aria-modal="true"
          className="flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-4rem)] bg-background border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 ring-1 ring-black/5 dark:ring-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full overflow-hidden border border-white">
                  {/* PH Flag simulation */}
                  <div className="w-full h-full flex flex-col">
                    <div className="h-1/2 bg-blue-600"></div>
                    <div className="h-1/2 bg-red-600"></div>
                    <div className="absolute left-0 top-0 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-white"></div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Ka-Daine Resident Assistant</h3>
                <div className="flex items-center text-xs text-primary-foreground/80">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span>
                  Online
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-black/10 rounded-full transition-colors focus:outline-none"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-zinc-950">
            {messages.length === 0 ? (
              <div className="flex flex-col h-full items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-medium text-foreground">Magandang araw po!</h4>
                  <p className="text-sm text-muted-foreground">Ako si Ka-Daine. Paano ko po kayo matutulungan ngayon?</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-background border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center space-x-2 relative"
            >
              <input
                type="text"
                value={input}
                maxLength={500}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message (max 500 chars)..."
                aria-label="Type your question for Ka-Daine"
                className="flex-1 bg-slate-100 dark:bg-zinc-900 border-transparent focus:bg-white dark:focus:bg-zinc-950 border focus:border-primary/50 text-sm rounded-full pl-4 pr-12 py-3 outline-none transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
