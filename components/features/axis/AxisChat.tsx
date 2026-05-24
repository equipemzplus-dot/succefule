import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, Sparkles, ChevronRight, ArrowLeft, Crown, Zap, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAxis } from './AxisProvider.tsx';
import { AxisLogo } from './AxisEntity.tsx';
import { UserProfile, TabId } from '../../../types.ts';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AxisChatProps {
  profile: UserProfile | null;
  onSwitchTab: (tabId: TabId) => void;
}

export const AxisChat: React.FC<AxisChatProps> = ({ profile, onSwitchTab }) => {
  const { setIsChatOpen, setAxisState } = useAxis();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPremium = profile?.user_level === 'niveau_mz_plus';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getStandardConvincingMessage = () => {
    const variations = [
      "Hey ! Quel dommage, je ne peux pas encore te révéler mes secrets financiers car tu es un membre standard. Prolongeons cette discussion en passant au plan Premium !",
      "Je sens un fort potentiel en toi, mais mes algorithmes d'élite ne sont accessibles qu'aux membres Premium. Rejoins l'élite pour qu'on commence sérieusement !",
      "Tes questions sont excellentes, mais la route vers le succès nécessite des outils Premium. Débloque mon accès complet dès maintenant !",
      "Axis est ton allié vers le premier million, mais cet allié ne s'active pleinement qu'en mode MZ+. Devenons partenaires Premium aujourd'hui !"
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  };

  const handleSend = async (messageTextOrEvent?: string | React.MouseEvent | React.KeyboardEvent) => {
    const messageText = typeof messageTextOrEvent === 'string' ? messageTextOrEvent : input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    
    if (messageText === input) {
      setInput('');
    }
    setIsLoading(true);
    setAxisState('progression');

    // Simulate AI thinking for standard users before sending the hardcoded rejection
    if (!isPremium) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: getStandardConvincingMessage() 
      }]);
      setAxisState('idle');
      setIsLoading(false);
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: messageText }] }
        ],
        config: {
          systemInstruction: "Tu es Axis, l'intelligence artificielle d'élite de Millionaire Zone Plus (MZ+). " +
          "Ton rôle est d'accompagner les futurs millionnaires dans leur ascension financière. " +
          "Sois encourageant, dynamique, et utilise un ton 'Premium', 'Royal' et 'Direct'. " +
          "Tes réponses doivent être concises, percutantes et motivantes. " +
          "Tu parles à un membre PREMIUM, traite-le avec tout le respect qu'il mérite. " +
          "L'application MZ+ est un écosystème complet avec : " +
          "- Formations (Trading, RPA, Business) " +
          "- Système de progression 'Elite' avec XP et Rangs " +
          "- Défis quotidiens et hebdomadaires " +
          "- Système d'affiliation puissant " +
          "Réponds toujours en français.",
          temperature: 0.8,
        },
      });

      if (!response || !response.text) {
        throw new Error("EMPTY_RESPONSE");
      }

      setMessages(prev => [...prev, { role: 'model', content: response.text }]);
      setAxisState('idle');
    } catch (error: any) {
      console.error("AXIS_CHAT_CRITICAL_FAILURE:", error);
      
      let errorMessage = "Désolé, j'ai eu une micro-coupure dans mes circuits. Peux-tu reformuler ? Mon éveil est encore en cours.";
      
      if (error.message === "API_KEY_MISSING") {
        errorMessage = "Mon noyau de calcul (Clé API) n'est pas encore configuré. Contactez l'administrateur.";
      } else if (error.message === "EMPTY_RESPONSE") {
        errorMessage = "Mes circuits ont produit une réponse vide. Ressayons ?";
      }

      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
      setAxisState('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setIsChatOpen(false);
    onSwitchTab('dashboard');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0510] flex flex-col text-white animate-in fade-in duration-500">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 sm:px-6 sm:py-5 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={handleBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
          >
            <ArrowLeft size={18} className="text-purple-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[11px] sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">Axis AI</h1>
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[8px] font-black text-purple-400 uppercase tracking-widest">Premium</span>
            </div>
            <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">D'Elite</p>
          </div>
        </div>
        
        {!isPremium && (
          <button 
            onClick={() => onSwitchTab('flash_offer')}
            className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.3)] whitespace-nowrap"
          >
            <Crown size={10} className="hidden xs:block" />
            MZ+ <span className="hidden sm:inline">Premium</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6"
      >
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 animate-pulse" />
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-500/30 flex items-center justify-center rotate-12 relative z-10 transition-transform hover:rotate-0 duration-500 group">
                <Bot className="text-purple-400 group-hover:scale-110 transition-transform" size={48} />
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3">Bonjour {profile?.full_name?.split(' ')[0]}</h2>
            <p className="text-neutral-400 max-w-xs text-sm leading-relaxed mb-10">
              Je suis prêt à propulser ton business vers de nouveaux sommets. Quelle est notre mission aujourd'hui ?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
              {[
                { text: "Comment faire ma première vente ?", icon: Zap },
                { text: "Quel produit choisir ?", icon: Crown },
                { text: "Développer mon équipe", icon: MessageSquare },
                { text: "Viralité TikTok", icon: Sparkles }
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(item.text)}
                  className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/10 transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <item.icon size={20} className="text-purple-500" />
                    <span className="text-sm font-bold text-neutral-300 group-hover:text-white">{item.text}</span>
                  </div>
                  <ChevronRight size={16} className="text-neutral-600 group-hover:text-purple-500 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((m, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'model' && (
              <div className="flex-shrink-0 mt-1">
                <AxisLogo state="idle" size="w-8 h-8 rounded-xl" />
              </div>
            )}
            <div className={`max-w-[85%] space-y-3 ${m.role === 'user' ? 'items-end ml-auto' : 'items-start mr-auto'}`}>
              <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-purple-600 text-white font-bold shadow-[0_10px_30px_rgba(168,85,247,0.2)] rounded-tr-none' 
                  : 'bg-white/5 text-neutral-200 border border-white/10 backdrop-blur-xl rounded-tl-none'
              }`}>
                {m.content}
              </div>
              
              {m.role === 'model' && !isPremium && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => onSwitchTab('flash_offer')}
                  className="mt-2 w-full p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 flex items-center justify-between group hover:bg-amber-500/20 transition-all font-bold text-amber-400 text-[10px] sm:text-xs uppercase tracking-widest"
                >
                  <span>Passer Premium</span>
                  <div className="flex items-center gap-2">
                    <Crown size={12} className="animate-bounce" />
                    <ChevronRight size={14} />
                  </div>
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start gap-3 items-start">
            <div className="flex-shrink-0 mt-1">
               <AxisLogo state="progression" size="w-8 h-8 rounded-xl" />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-purple-500"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 sm:p-6 bg-black/40 border-t border-white/5">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition-opacity" />
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pose ta question..."
              className="w-full bg-[#120a1e] border border-white/10 rounded-[1.8rem] py-4 sm:py-5 pl-6 sm:pl-7 pr-16 sm:pr-20 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all shadow-2xl"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl transition-all ${
                input.trim() && !isLoading 
                  ? 'bg-purple-600 text-white shadow-lg scale-100 hover:scale-110 active:scale-95' 
                  : 'bg-white/5 text-white/20 scale-90'
              }`}
            >
              <Send size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        <p className="text-center text-[8px] sm:text-[10px] text-neutral-600 mt-3 sm:mt-4 font-black uppercase tracking-[0.2em]">
          Axis AI • Intelligence Artificielle Expérimentale
        </p>
      </div>
    </div>
  );
};
