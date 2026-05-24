
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, UserPlus, Zap, Crown, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../services/firebase.ts';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface ActivityEvent {
  id: string;
  type: 'gain' | 'join' | 'premium' | 'coaching';
  user: string;
  detail: string;
  time: string;
}

export const LivePulse: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'live_pulse'),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents: ActivityEvent[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          user: data.user_name,
          detail: data.detail,
          time: 'À l\'instant' // Dynamic time could be handled with a hook
        };
      });
      
      if (newEvents.length > 0) {
        setEvents(newEvents);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'live_pulse');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [events]);

  if (loading) {
    return (
      <div className="h-10 flex items-center justify-center gap-2 opacity-50">
        <Loader2 size={12} className="animate-spin text-yellow-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">Elite Pulse...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="h-10 flex items-center justify-center opacity-20">
        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Pulse en attente d'activité</span>
      </div>
    );
  }

  const event = events[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case 'gain': return <Zap size={14} className="text-yellow-500" />;
      case 'join': return <UserPlus size={14} className="text-emerald-500" />;
      case 'premium': return <Crown size={14} className="text-purple-500" />;
      case 'coaching': return <Trophy size={14} className="text-blue-500" />;
      default: return <Sparkles size={14} className="text-yellow-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'gain': return 'bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/5';
      case 'join': return 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5';
      case 'premium': return 'bg-purple-500/10 border-purple-500/20 shadow-purple-500/5';
      case 'coaching': return 'bg-blue-500/10 border-blue-500/20 shadow-blue-500/5';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="h-10 overflow-hidden flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={event.id}
          initial={{ y: 30, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ y: -30, opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1] // Custom quint ease out
          }}
          className={`flex items-center gap-3 px-6 py-2 rounded-full border ${getBg(event.type)} backdrop-blur-xl shadow-2xl transition-colors duration-500 group cursor-default`}
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            {getIcon(event.type)}
          </motion.div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">{event.user}</span>
            <span className="text-[10px] font-medium text-neutral-400 normal-case italic group-hover:text-neutral-300 transition-colors">{event.detail}</span>
          </div>
          <div className="h-3 w-px bg-white/10 mx-2"></div>
          <div className="flex items-center gap-1.5 overflow-hidden">
             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest whitespace-nowrap">{event.time}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
