import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, X, Gift, Users, Copy, CheckCircle } from 'lucide-react';
import { GoldBorderCard, PrimaryButton, GoldText } from '../../UI.tsx';

export const ShareModal = ({ isVisible, onClose, referralCode }: { isVisible: boolean, onClose: () => void, referralCode?: string }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const shareUrl = referralCode ? `${baseUrl}/register?ref=${referralCode}` : baseUrl;
  const shareText = `Je viens de tomber sur MZ+.\nC’est un système en ligne qui permettrait de générer des revenus en ligne assez simplement.\nJ'ai déjà commencé et franchement ça a l’air intéressant.\nSi tu veux jeter un œil 👇\n\n${shareUrl}`;

  const handleShare = (platform: string) => {
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return; // Don't close for copy
    }
    
    // Optional: close after interacting
    setTimeout(onClose, 500);
  };

  // Reset state when closing/opening
  React.useEffect(() => {
    if (isVisible) {
      setShowOptions(false);
      setCopied(false);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, filter: "blur(5px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto max-w-[340px] w-full mx-4"
          >
            <GoldBorderCard className="relative overflow-hidden !p-8 shadow-[0_30px_100px_rgba(0,0,0,1)] bg-black/95 backdrop-blur-2xl">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors" 
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center text-center mt-2 relative z-10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-gold-main)] to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(201,168,76,0.4)] mb-6"
                >
                  <Gift className="text-black" size={32} />
                </motion.div>
                
                <GoldText className="text-2xl font-black mb-3">Partage MZ+</GoldText>
                
                <p className="text-[#a19d93] text-sm font-medium mb-8 leading-relaxed">
                  Partage MZ+ avec tes amis et gagne encore plus de points ! 🎁
                </p>
                
                <div className="w-full">
                  {!showOptions ? (
                    <PrimaryButton 
                      onClick={() => setShowOptions(true)} 
                      className="w-full flex items-center justify-center gap-3 py-4 text-sm tracking-wide shadow-[0_0_20px_rgba(201,168,76,0.2)]"
                    >
                      <Share2 size={18} />
                      Partager & Gagner
                    </PrimaryButton>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-2 gap-3"
                    >
                      <button 
                        onClick={() => handleShare('whatsapp')}
                        className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.548 0 10.058-4.51 10.06-10.059.002-2.689-1.047-5.215-2.951-7.121-1.905-1.905-4.432-2.954-7.122-2.956-5.549 0-10.06 4.511-10.063 10.06-.001 2.032.547 3.513 1.488 5.13l-.999 3.648 3.731-.979zm11.367-7.393c-.31-.154-1.829-.903-2.11-.1.282-.102-.338-.204-.984-1.392-.506-.21-.422-.224-.744-.095-.547-.223-2.01-.739-3.344-1.928-1.037-.926-1.74-2.069-1.942-2.422-.204-.353-.021-.544.155-.72.158-.159.352-.412.529-.617.175-.206.234-.352.352-.588.117-.235.059-.441-.03-.617-.089-.176-.744-1.792-1.018-2.454-.267-.643-.538-.556-.744-.567-.19-.009-.41-.01-.63-.01-.22 0-.58.083-.884.412-.303.33-1.157 1.132-1.157 2.76 0 1.629 1.186 3.203 1.353 3.424.167.221 2.335 3.563 5.656 4.996.79.341 1.405.544 1.886.696.791.248 1.512.213 2.081.127.635-.095 1.829-.747 2.086-1.468.257-.721.257-1.341.18-1.468-.077-.127-.282-.204-.593-.352z"/></svg>
                        </div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider mt-1">WhatsApp</span>
                      </button>

                      <button 
                        onClick={() => handleShare('facebook')}
                        className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 hover:bg-[#1877F2]/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-lg shadow-[#1877F2]/20">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider mt-1">Facebook</span>
                      </button>
                      
                      {navigator.share && (
                        <button 
                          onClick={async () => {
                            try {
                              await navigator.share({ title: 'Rejoins MZ+', text: shareText, url: shareUrl });
                              setTimeout(onClose, 500);
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors col-span-2 mt-1"
                        >
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Share2 size={18} />
                          </div>
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider mt-1">Autres options</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </GoldBorderCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
