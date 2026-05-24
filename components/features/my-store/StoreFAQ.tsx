import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const faqs = [
  {
    q: "C’est quoi l’affiliation MZ+ ?",
    a: "L’affiliation MZ+ consiste à partager des produits via ton lien personnel. Quand quelqu’un achète grâce à ton lien, tu gagnes une commission."
  },
  {
    q: "Comment je gagne de l’argent concrètement ?",
    a: "Tu choisis un produit, tu récupères ton lien, tu le partages (TikTok, WhatsApp, Instagram…). Une personne achète → tu gagnes de l’argent."
  },
  {
    q: "Comment je suis payé ?",
    a: "Les gains sont suivis sur ton tableau de bord. Tu pourras les retirer directement sur ton mobile money à tout moment. Les méthodes de paiement sont adaptées pour permettre aux utilisateurs de recevoir leurs revenus facilement."
  },
  {
    q: "Est-ce que ça marche dans mon pays ?",
    a: "Oui, MZ+ est conçu pour être accessible, notamment en Afrique, avec des solutions adaptées."
  },
  {
    q: "Comment savoir que j’ai fait une vente ?",
    a: "Dès qu’une personne achète un produit avec ton lien, la vente est automatiquement enregistrée sur ton compte. Tu peux voir directement le statut de tes ventes ici dans les statistiques détaillées sur la partie activité récente."
  },
  {
    q: "Comment fonctionne le processus de vente concrètement ?",
    a: "1️⃣ Une personne clique sur ton lien d’affiliation MZ+\n2️⃣ Elle accède à la page du produit sur MZ+ et clique sur “Acheter”\n3️⃣ Elle est redirigée vers Chariow, la plateforme sécurisée qui gère le paiement\n4️⃣ Le client finalise son paiement sur Chariow\n5️⃣ Grâce à l'intégration Chariow/MZ+, une fois le paiement validé, Chariow confirme la transaction à MZ+\n6️⃣ MZ+ enregistre automatiquement la vente\n7️⃣ Ta commission est calculée et ajoutée directement à ton solde"
  },
  {
    q: "Combien de temps avant les premiers résultats ?",
    a: "Certains obtiennent des résultats rapidement, d’autres prennent plus de temps. Tout dépend de ton engagement et de ta constance. Mais si tu veux avoir un suivi et un coaching personnalisé pour avoir des résultats le plus rapidement possible, passe à la MZ+ Premium."
  },
  {
    q: "Et si je n’ai aucun résultat ?",
    a: "C’est souvent parce que tu ne sais pas quoi faire ou tu n’appliques pas la bonne stratégie. C’est exactement ce que le Niveau MZ+ Premium aide à corriger."
  },
  {
    q: "Comment je trouve des clients ?",
    a: "En créant du contenu sur : TikTok, WhatsApp (en partageant les produits), Instagram. Tu attires des personnes intéressées, puis elles cliquent sur ton lien."
  },
  {
    q: "Est-ce que je peux promouvoir plusieurs produits en même temps ?",
    a: "Oui, mais il est recommandé de commencer avec 1 seul produit. Cela te permet de rester focus et d’obtenir tes premiers résultats plus rapidement."
  },
  {
    q: "Où est-ce que je peux partager mon lien ?",
    a: "Tu peux partager ton lien sur : TikTok (en créant du contenu, la méthode qui rapporte le plus de ventes), WhatsApp (statuts, groupes), Instagram, Facebook. L’objectif est de toucher des personnes intéressées par le problème que résout ton produit."
  }
];

export const StoreFAQ = () => {
    const [page, setPage] = useState(0);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const itemsPerPage = 3;
    const totalPages = Math.ceil(faqs.length / itemsPerPage);
    const startIndex = page * itemsPerPage;
    const visibleFaqs = faqs.slice(startIndex, startIndex + itemsPerPage);

    const toggleFaq = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const nextPage = () => {
        setPage((prev) => (prev + 1) % totalPages);
        setExpandedIndex(null);
    };

    const prevPage = () => {
        setPage((prev) => (prev - 1 + totalPages) % totalPages);
        setExpandedIndex(null);
    };

    return (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 lg:p-8 space-y-6 mt-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <HelpCircle size={16} />
                   </div>
                   <div>
                       <h3 className="text-[14px] font-black text-white italic tracking-tighter uppercase">Foire aux questions</h3>
                       <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">Tout ce que tu dois savoir</p>
                   </div>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5">
                    <button onClick={prevPage} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all active:scale-95">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[10px] font-bold text-white/30 uppercase w-8 text-center tracking-widest">
                        {page + 1}/{totalPages}
                    </span>
                    <button onClick={nextPage} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all active:scale-95">
                        <ChevronRight size={14} />
                    </button>
                </div>
             </div>

             <div className="space-y-3">
                 <AnimatePresence mode="wait">
                     <motion.div 
                        key={page}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                     >
                         {visibleFaqs.map((faq, idx) => {
                             const actualIndex = startIndex + idx;
                             const isExpanded = expandedIndex === actualIndex;
                             return (
                                 <div key={actualIndex} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all duration-300">
                                     <button 
                                         onClick={() => toggleFaq(actualIndex)}
                                         className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/[0.04] transition-colors"
                                     >
                                         <span className="text-[12px] sm:text-[13px] font-bold text-white pr-4 leading-relaxed tracking-tight">{faq.q}</span>
                                         <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                                             <ChevronDown size={14} />
                                         </div>
                                     </button>
                                     <AnimatePresence>
                                         {isExpanded && (
                                             <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="px-4 sm:px-5 pb-4 sm:pb-5"
                                             >
                                                 <div className="text-[11px] sm:text-[12px] text-white/60 leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-blue-500/30">
                                                     {faq.a}
                                                 </div>
                                             </motion.div>
                                         )}
                                     </AnimatePresence>
                                 </div>
                             );
                         })}
                     </motion.div>
                 </AnimatePresence>
             </div>
        </div>
    );
};
