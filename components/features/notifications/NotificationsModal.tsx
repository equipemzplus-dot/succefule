import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase.ts';
import { X, Bell, Trash2, Coins, Gift, AlertTriangle, Sparkles, CheckCircle2, Heart, Zap, MessageCircle } from 'lucide-react';
import { 
  getInternalNotifications, 
  markAllAsRead as markInternalAllAsRead, 
  markAsRead as markInternalAsRead,
  deleteInternalNotification
} from '../../../services/internalNotificationService';

interface NotificationsModalProps {
  onClose: () => void;
  profile: any;
  setActiveTab?: (tab: any) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose, profile, setActiveTab }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Admin Push Notifications (Global/Targeted)
      const { data: pushData } = await supabase
        .from('admin_push_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      let processedPush: any[] = [];
      const deletedIds = new Set(JSON.parse(localStorage.getItem('mz_deleted_notification_ids') || '[]'));

      if (pushData) {
        const relevant = pushData.filter(n => {
          if (deletedIds.has(n.id)) return false;
          if (n.target_type === 'all') return true;
          if (n.target_type === 'level') return n.target_value === profile.user_level;
          if (n.target_type === 'user') return n.target_value === profile.id;
          return false;
        });

        const { data: readData } = await supabase
          .from('admin_push_receipts')
          .select('notification_id')
          .eq('user_id', profile.id);

        const readIds = new Set((readData || []).map(r => r.notification_id));

        processedPush = relevant.map(n => ({
          id: n.id,
          title: n.title,
          body: n.body,
          created_at: n.created_at,
          icon_type: n.icon_type,
          isRead: readIds.has(n.id),
          isInternal: false
        }));
      }

      // 2. Fetch Internal Evolution & Premium Upsell Notifications
      const internalData = await getInternalNotifications(profile.id);
      const processedInternal = internalData
        .filter(n => !deletedIds.has(n.id))
        .map(n => {
          const metadata = (n as any).metadata || {};
          
          // Custom UI mappings for in-app display based on type
          let displayTitle = (n as any).title || metadata.title;
          if (!displayTitle) {
            if (n.type === 'premium_upsell') {
              displayTitle = 'Régularité Elite 💎';
            } else if (n.type === 'evolution_reaction') {
              displayTitle = 'Vibe de soutien ! 🔥';
            } else if (n.type?.startsWith('inactivity_')) {
              displayTitle = 'Alerte Inactivité ⚠️';
            } else if (n.type?.startsWith('challenge_')) {
              displayTitle = 'Défi 3 Jours 🚀';
            } else {
              displayTitle = 'Évolution';
            }
          }
          
          let displayIconType = metadata.icon_type;
          if (!displayIconType) {
            if (n.type === 'premium_upsell' || n.type?.includes('upsell') || n.type?.includes('inactivity')) {
              displayIconType = 'premium_upsell';
            } else if (n.type === 'evolution_reaction') {
              displayIconType = 'reaction';
            } else if (n.type?.includes('success')) {
              displayIconType = 'gift';
            } else {
              displayIconType = 'default';
            }
          }

          return {
            id: n.id,
            title: displayTitle,
            body: n.message,
            created_at: n.created_at,
            icon_type: displayIconType,
            isRead: n.is_read,
            isInternal: true,
            type: n.type,
            metadata: metadata
          };
        });

      // Combine and Sort
      const combined = [...processedPush, ...processedInternal].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
     try {
       // Mark Admin Push as Read
       const unreadPushIds = notifications.filter(n => !n.isRead && !n.isInternal).map(n => n.id);
       if (unreadPushIds.length > 0) {
         const inserts = unreadPushIds.map(id => ({ notification_id: id, user_id: profile.id }));
         await supabase.from('admin_push_receipts').insert(inserts);
       }

       // Mark Internal as Read
       await markInternalAllAsRead(profile.id);
       
       setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
       window.dispatchEvent(new CustomEvent('mz-notifications-updated'));
     } catch(e) {
       console.error(e);
     }
  };

  const markSingleAsRead = async (notif: any) => {
    if (notif.isRead) return;
    
    try {
      if (notif.isInternal) {
        await markInternalAsRead(notif.id);
      } else {
        await supabase.from('admin_push_receipts').insert({ notification_id: notif.id, user_id: profile.id });
      }
      
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      window.dispatchEvent(new CustomEvent('mz-notifications-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSingleNotification = async (e: React.MouseEvent, notif: any) => {
    e.stopPropagation();
    try {
      // 1. Unified robust localStorage tracking
      const deletedNotifs = JSON.parse(localStorage.getItem('mz_deleted_notification_ids') || '[]');
      if (!deletedNotifs.includes(notif.id)) {
        deletedNotifs.push(notif.id);
        localStorage.setItem('mz_deleted_notification_ids', JSON.stringify(deletedNotifs));
      }

      // 2. Clear backend database row in background
      if (notif.isInternal) {
        deleteInternalNotification(notif.id).catch(err => console.error("Error deleting backend row:", err));
      }

      // 3. Sync local UI states
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      window.dispatchEvent(new CustomEvent('mz-notifications-updated'));
    } catch (err) {
      console.error("Error deleting single notification:", err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    await markSingleAsRead(notif);
    
    // Redirect to Evolution Feed Tab and scroll/focus on post if reaction type or broadcast notification
    if ((notif.type === 'evolution_reaction' || notif.type === 'evolution_broadcast') && notif.metadata?.post_id) {
      const postId = notif.metadata.post_id;
      
      localStorage.setItem('mz_scroll_to_post', postId);
      (window as any).mz_scroll_to_post = postId;
      
      // Notify active listeners
      window.dispatchEvent(new CustomEvent('mz-scroll-to-post', { detail: { postId } }));
      
      if (setActiveTab) {
        setActiveTab('evolution');
      }
      onClose();
    } else if (notif.type === 'premium_upsell') {
      if (setActiveTab) {
        setActiveTab('flash_offer');
      }
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'money': return <Coins className="text-yellow-500" size={20} />;
      case 'gift': return <Gift className="text-emerald-500" size={20} />;
      case 'alert': return <AlertTriangle className="text-red-500" size={20} />;
      case 'reaction': return <Heart className="text-pink-500 fill-pink-500" size={20} />;
      case 'premium_upsell': return <Zap className="text-purple-400 animate-pulse" size={20} />;
      default: return <Sparkles className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/60 backdrop-blur-sm sm:items-stretch items-end">
      <div 
        className="w-full sm:w-[400px] h-[85vh] sm:h-full bg-[#0a0a0a] border-t sm:border-t-0 sm:border-l border-white/10 flex flex-col animate-slide-up sm:animate-slide-left shadow-2xl relative"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-card-start)] border border-[var(--color-border-gold)] rounded-xl flex items-center justify-center">
              <Bell className="text-[var(--color-gold-main)]" size={20} />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">Notifications</h2>
              <p className="text-neutral-400 text-xs">Vos dernières alertes MZ+</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-end mb-2">
             <button 
                onClick={markAllAsRead} 
                className="text-xs text-[var(--color-gold-main)] flex items-center gap-1 hover:underline"
             >
                <CheckCircle2 size={12} /> Tout marquer comme lu
             </button>
          </div>
          
          {loading ? (
             <div className="py-12 flex justify-center">
               <div className="w-6 h-6 border-2 border-[var(--color-gold-main)] border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : notifications.length === 0 ? (
             <div className="py-12 text-center text-neutral-500">
               <Bell className="mx-auto mb-3 opacity-20" size={32} />
               <p className="text-sm">Aucune notification pour le moment.</p>
             </div>
          ) : (
            notifications.map((n) => {
              const isBlinking = !n.isRead && (n.type === 'premium_upsell' || n.metadata?.is_blink);
              return (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                    n.isRead 
                      ? 'bg-white/5 border-white/5 opacity-70' 
                      : isBlinking 
                        ? 'bg-purple-950/20 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-[pulse_2s_infinite] hover:scale-[1.01]' 
                        : 'bg-[var(--color-card-start)] border-[var(--color-border-gold)] shadow-[0_0_15px_rgba(201,168,76,0.1)] hover:scale-[1.01]'
                  }`}
                >
                  {/* Subtle Background Glow for Blinking Premium Option */}
                  {isBlinking && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 pointer-events-none" />
                  )}
                  
                  <div className="flex gap-4 relative z-10">
                    <div className="shrink-0 mt-1">
                      {getIcon(n.icon_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-bold flex items-center gap-1.5 ${n.isRead ? 'text-neutral-500' : 'text-white'}`}>
                          {n.title}
                          {isBlinking && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping shrink-0" />
                          )}
                        </h4>
                        
                        {/* Interactive Real-Time Indicator & Delete Options */}
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          {n.isRead ? (
                            <CheckCircle2 size={14} className="text-emerald-500 opacity-60" />
                          ) : (
                            <span className="block w-2.5 h-2.5 rounded-full bg-[var(--color-gold-main)] shadow-[0_0_8px_rgba(201,168,76,0.6)] animate-pulse" />
                          )}
                          
                          <button
                            onClick={(e) => deleteSingleNotification(e, n)}
                            className="p-1 h-7 w-7 flex items-center justify-center text-neutral-500 hover:text-red-500 rounded-lg hover:bg-white/10 transition-colors md:opacity-0 group-hover:opacity-100 focus:opacity-100-all"
                            title="Supprimer la notification"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed whitespace-pre-line break-words">
                        {n.body}
                      </p>
                      
                      {/* Premium Action CTA inside the Notification Modal */}
                      {n.type === 'premium_upsell' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markSingleAsRead(n);
                            if (setActiveTab) {
                              setActiveTab('flash_offer');
                            }
                            onClose();
                          }}
                          className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-950/30 hover:scale-[1.02] active:scale-95 pointer-events-auto"
                        >
                          <Zap size={11} className="animate-pulse" />
                          {n.metadata?.cta_label || 'Profiter de l\'offre ⚡'}
                        </button>
                      )}

                      <p className="text-[10px] text-neutral-500 mt-2">
                         {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
