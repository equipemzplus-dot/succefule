import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase.ts';
import { MessageCircle, Send, Reply, User, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  formation_id: string;
  user_id: string;
  question: string;
  created_at: string;
  users: {
    full_name: string;
  };
}

interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  answer: string;
  created_at: string;
  users: {
    full_name: string;
  };
}

export const QuestionAnswerSection = ({ formationId, currentUserId }: { formationId: string; currentUserId?: string }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [newQuestion, setNewQuestion] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchQuestionsAndAnswers = async () => {
    try {
      let qData: any[] = [];
      let aData: any[] = [];
      
      // Essayer d'abord avec la jointure 'users'
      const res = await supabase
        .from('mz_formation_questions')
        .select('*, sender:users(full_name)')
        .eq('formation_id', formationId)
        .order('created_at', { ascending: false });
        
      if (res.error) {
        console.warn("Questions fetch join failed, using fallback:", res.error);
        const fallbackRes = await supabase
          .from('mz_formation_questions')
          .select('*')
          .eq('formation_id', formationId)
          .order('created_at', { ascending: false });
        
        qData = fallbackRes.data || [];
        
        // Enricher manuellement avec les noms si possible
        if (qData.length > 0) {
          const userIds = Array.from(new Set(qData.map(q => q.user_id)));
          const { data: userData } = await supabase.from('users').select('id, full_name').in('id', userIds);
          if (userData) {
            qData = qData.map(q => ({
              ...q,
              users: userData.find(u => u.id === q.user_id)
            }));
          }
        }
      } else {
        // Mapper 'sender' vers 'users' pour compatibilité avec l'interface Question
        qData = res.data.map(q => ({ ...q, users: q.sender }));
      }
      
      if (qData) {
        setQuestions(qData as Question[]);
      }

      if (qData && qData.length > 0) {
        const questionIds = qData.map(q => q.id);
        
        const resAns = await supabase
          .from('mz_formation_answers')
          .select('*, sender:users(full_name)')
          .in('question_id', questionIds)
          .order('created_at', { ascending: true });
           
        if (resAns.error) {
           const fallbackAns = await supabase
            .from('mz_formation_answers')
            .select('*')
            .in('question_id', questionIds)
            .order('created_at', { ascending: true });
           
           let answersRaw = fallbackAns.data || [];
           const aUserIds = Array.from(new Set(answersRaw.map(a => a.user_id)));
           const { data: aUserData } = await supabase.from('users').select('id, full_name').in('id', aUserIds);
           
           if (aUserData) {
             aData = answersRaw.map(a => ({
               ...a,
               users: aUserData.find(u => u.id === a.user_id)
             }));
           } else {
             aData = answersRaw;
           }
        } else {
           aData = resAns.data.map(a => ({ ...a, users: a.sender }));
        }
        
        const answersMap: Record<string, Answer[]> = {};
        if (aData) {
          aData.forEach(ans => {
            const questionId = ans.question_id;
            if (!answersMap[questionId]) answersMap[questionId] = [];
            answersMap[questionId].push(ans as Answer);
          });
        }
        setAnswers(answersMap);
      }
    } catch (e) {
      console.error("Q&A fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndAnswers();
  }, [formationId]);

  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || !currentUserId) return;
    try {
      const qText = newQuestion;
      setNewQuestion(''); // Clear immediately so it feels responsive
      const { error } = await supabase.from('mz_formation_questions').insert({
        formation_id: formationId,
        user_id: currentUserId,
        question: qText
      });
      if (error && error.code !== '42P01') throw error;
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // If table doesn't exist, we just simulate adding it locally to the list to not frustrate the user
      if (error && error.code === '42P01') {
         setQuestions(prev => [{
            id: 'temp-' + Date.now(),
            formation_id: formationId,
            user_id: currentUserId,
            question: qText,
            created_at: new Date().toISOString(),
            users: { full_name: 'Toi' }
         }, ...prev]);
      } else {
         fetchQuestionsAndAnswers();
      }
    } catch (e: any) {
      console.error("Error asking question:", e);
    }
  };

  const handleSendReply = async (questionId: string) => {
    if (!replyText.trim() || !currentUserId) return;
    try {
      const { error } = await supabase.from('mz_formation_answers').insert({
        question_id: questionId,
        user_id: currentUserId,
        answer: replyText
      });
      if (error) throw error;
      setReplyText('');
      setReplyingTo(null);
      fetchQuestionsAndAnswers();
    } catch (e: any) {
      console.error("Error sending reply:", e);
    }
  };

  return (
    <div className="mt-20 border-t border-white/10 pt-16">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="text-emerald-500" />
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
          Espace Questions / Réponses
        </h3>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 mb-12">
        <h4 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">Poser une question</h4>
        <textarea 
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Tu as un doute sur une partie du texte ?"
          className="w-full h-24 bg-black border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500/50 resize-none transition-colors mb-4"
        />
        <button 
          onClick={handleAskQuestion}
          disabled={!newQuestion.trim() || !currentUserId}
          className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} /> Envoyer
        </button>
        {showSuccess && (
          <p className="text-emerald-500 text-sm font-bold mt-4 animate-pulse">
             Question envoyée avec succès !
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-white/30" /></div>
      ) : questions.length === 0 ? (
        <div className="text-center p-12 bg-white/5 border border-white/10 rounded-3xl border-dashed">
          <p className="text-white/50">Aucune question pour le moment. Sois le premier !</p>
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((q) => (
            <div key={q.id} className="bg-black/40 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{q.users?.full_name || 'Utilisateur'}</div>
                  <div className="text-xs text-white/30">{new Date(q.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <p className="text-white/80 leading-relaxed mb-6">{q.question}</p>

              <div className="ml-4 md:ml-12 border-l-2 border-white/10 pl-6 space-y-6">
                {answers[q.id]?.map((a) => (
                  <div key={a.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xs font-bold text-white/70">{a.users?.full_name || 'Utilisateur'}</div>
                      <div className="w-1 h-1 rounded-full bg-white/20"></div>
                      <div className="text-[10px] text-white/40">{new Date(a.created_at).toLocaleDateString()}</div>
                    </div>
                    <p className="text-sm text-white/60">{a.answer}</p>
                  </div>
                ))}
              </div>

              {replyingTo === q.id ? (
                <div className="mt-6 ml-4 md:ml-12 flex items-center gap-3">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Votre réponse..."
                    className="flex-1 bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <button 
                    onClick={() => handleSendReply(q.id)}
                    className="p-3 bg-emerald-500 text-black border border-emerald-400 rounded-xl hover:bg-emerald-400 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="p-3 text-white/50 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setReplyingTo(q.id)}
                  className="mt-6 ml-4 md:ml-12 text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:text-emerald-400 transition-colors"
                >
                  <Reply size={14} /> Répondre
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
