import React, { useEffect, useCallback } from 'react';
import { useAxis } from './AxisProvider';

interface AxisGuideFlowProps {
  session: { user?: { user_metadata?: { full_name?: string } } } | null;
  userProfile: { full_name?: string } | null;
  isReady: boolean;
}

export const AxisGuideFlow: React.FC<AxisGuideFlowProps> = ({ session, userProfile, isReady }) => {
  const { triggerAxisMessage } = useAxis();

  const startGuide = useCallback(() => {
    const userName = userProfile?.full_name || session?.user?.user_metadata?.full_name?.split(' ')[0] || "partenaire";
    
    // Étape 1 : Salutation
    setTimeout(() => {
      triggerAxisMessage(
        `Salut ${userName}… moi c'est Axis. 👁️\nTu veux changer ta situation financiere … sinon tu ne serais pas ici.\nJe peux t'aider si Tu es prêt passer à l'action.?`,
        'guiding',
        0, 
        {
          label: "Je suis prêt",
          action: () => {
            triggerAxisMessage("Initialisation...", "progression", 1500, undefined, "bottom-right");
            
            setTimeout(() => {
              // Lancer le scroll en premier
              window.dispatchEvent(new CustomEvent('mz-scroll-to-shop'));
              
              // Attendre la fin du scroll avant d'afficher le message et de mettre en évidence la boutique
              setTimeout(() => {
                triggerAxisMessage("Super. 🔥\nOn commence simplement.\nEntre dans ta boutique… je vais te montrer. 🛒", "guiding", 9000, undefined, "bottom-left");
                window.dispatchEvent(new CustomEvent('mz-highlight-shop'));
              }, 1200);
            }, 1000);
            
            window.addEventListener('mz-shop-opened', () => {
              triggerAxisMessage("Scan de la boutique...", "progression", 1500, undefined, "bottom-left");
              setTimeout(() => {
                const addBtn = document.getElementById('add-product-btn-empty') || document.getElementById('add-product-btn');
                
                if (addBtn) {
                  // Lancer le scroll vers le bouton ajouter
                  const targetY = addBtn.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2) + 50;
                  
                  const startY = window.scrollY;
                  const difference = targetY - startY;
                  let startTime: number | null = null;
                  const duration = 1500;
            
                  const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            
                  const step = (now: number) => {
                    if (!startTime) startTime = now;
                    const time = now - startTime;
                    const fraction = easeInOutCubic(Math.min(time / duration, 1));
                    window.scrollTo(0, startY + difference * fraction);
                    if (time < duration) window.requestAnimationFrame(step);
                  };
                  window.requestAnimationFrame(step);

                  // Afficher le message après le scroll
                  setTimeout(() => {
                    triggerAxisMessage("Tu y es… 👁️\nC’est ici que tout bascule.\nAjoute ton premier produit.", "guiding", 9000, undefined, "bottom-right");
                    window.dispatchEvent(new CustomEvent('mz-highlight-add-product'));
                  }, 1600);
                } else {
                  triggerAxisMessage("Tu y es… 👁️\nC’est ici que tout bascule.\nAjoute ton premier produit.", "guiding", 9000, undefined, "bottom-right");
                  window.dispatchEvent(new CustomEvent('mz-highlight-add-product'));
                }
              }, 1000);
            }, { once: true });
            
            // When they open the catalog, highlight the first product
            window.addEventListener('mz-catalog-opened', () => {
               triggerAxisMessage("Recherche d'opportunités...", "progression", 1500, undefined, "bottom-right");
               setTimeout(() => {
                 triggerAxisMessage("Voici les actifs disponibles.\nSélectionne le premier pour l'examiner. 🔍", "action", 8000, undefined, "bottom-left");
                 window.dispatchEvent(new CustomEvent('mz-highlight-first-product'));
                 
                 const btn = document.getElementById('first-catalog-product-btn');
                 if (btn) {
                   const targetY = btn.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2) + 50;
                   const startY = window.scrollY;
                   const difference = targetY - startY;
                   let startTime: number | null = null;
                   const duration = 1000;
                   const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                   const step = (now: number) => {
                     if (!startTime) startTime = now;
                     const time = now - startTime;
                     const fraction = easeInOutCubic(Math.min(time / duration, 1));
                     window.scrollTo(0, startY + difference * fraction);
                     if (time < duration) window.requestAnimationFrame(step);
                   };
                   window.requestAnimationFrame(step);
                 }
               }, 1500);
            }, { once: true });
            
            // Final step: they open product details
            window.addEventListener('mz-product-details-opened', () => {
               triggerAxisMessage("Calcul du rendement...", "progression", 1500, undefined, "top-center");
               setTimeout(() => {
                 window.dispatchEvent(new CustomEvent('mz-highlight-add-to-store'));
                 // Use top-center position to be high above modal, don't overlap button
                 triggerAxisMessage(
                   "Tu es à un pas. ⚡\nAjoute ce produit dans ta boutique.\nUn simple clic…\net tout démarre vraiment. 💸",
                   "success",
                   9000,
                   undefined,
                   "top-center"
                 );
               }, 1500);
            }, { once: true });
            
            // They click add to store
            window.addEventListener('mz-product-adding-to-store', () => {
               triggerAxisMessage("Intégration de l'actif...", "progression", 2000, undefined, "top-center");
            }, { once: true });
            
            // Tutorial complete
            window.addEventListener('mz-product-added-to-store', () => {
               sessionStorage.setItem('mz_axis_guide_active', 'false');
               setTimeout(() => {
                 triggerAxisMessage(
                   "Bien joué ⚡\nMaintenant… on passe à l’étape où tu vas gagner tes premiers gains 💸\nTu veux que je te montre comment ça marche ?",
                   "success",
                   15000,
                   {
                     label: "Let's go 💸",
                     action: () => {
                        const showStep4 = () => {
                          triggerAxisMessage(
                            <div className="flex flex-col gap-3">
                              <span className="font-extrabold text-white text-lg lg:text-xl">Et le meilleur ? 🎯</span>
                              <span className="text-white text-[15px]">Ton argent s'affiche sur ton solde en <span className="font-bold">temps réel ⚡</span></span>
                              <span className="text-white text-[15px]">Tu retires quand tu veux… directement sur ton <span className="font-black tracking-wide">Mobile Money 📱💸</span></span>
                            </div>,
                            "success",
                            15000,
                            {
                              label: "C'est parti 🔥",
                              action: () => {
                                // Hide current axis for 5s, then show the final one
                                setTimeout(() => {
                                  window.dispatchEvent(new CustomEvent('mz-highlight-promote'));
                                  triggerAxisMessage(
                                    <div className="flex flex-col gap-3">
                                      <span className="font-extrabold text-white text-[16px] lg:text-lg">C’est le moment de faire exploser tes ventes ⚡</span>
                                      <span className="text-white text-[14px]">Clique sur <span className="font-black uppercase px-2 py-0.5 rounded shadow-sm">Promouvoir</span> et partage ton produit 📲💸</span>
                                    </div>,
                                    "action",
                                    30000,
                                    {
                                      label: "J'ai compris",
                                      action: () => {
                                        let remaining = 7; // 7 seconds
                                        const timerInterval = setInterval(() => {
                                          if (document.visibilityState === 'visible') {
                                            remaining -= 1;
                                            if (remaining <= 0) {
                                              clearInterval(timerInterval);
                                              window.dispatchEvent(new CustomEvent('mz-xp-reward', { detail: { 
                                                amount: 100,
                                                title: "PREMIER PRODUIT IMPORTÉ",
                                                description: "XP ACCÉLÉRATEUR"
                                              } }));
                                            }
                                          }
                                        }, 1000);
                                      },
                                      secondaryLabel: "Retour",
                                      secondaryAction: showStep4
                                    },
                                    "smart"
                                  );
                                  window.dispatchEvent(new CustomEvent('mz-highlight-promote'));
                                }, 5000);
                              },
                              secondaryLabel: "Retour",
                              secondaryAction: showStep3
                            },
                            "bottom-right"
                          );
                        };

                        const showStep3 = () => {
                          triggerAxisMessage(
                            <div className="flex flex-col gap-3">
                              <span className="text-white text-[15px]">Tu les partages autour de toi ou sur tes <span className="font-bold">réseaux sociaux 🌐</span>…</span>
                              <span className="text-white text-[15px]">Chaque fois que quelqu’un achète grâce à toi…</span>
                              <span className="font-black text-white px-2 py-1 rounded text-lg w-fit">tu gagnes une commission 💰✨</span>
                            </div>,
                            "guiding",
                            15000,
                            {
                              label: "Suivant ➔",
                              action: showStep4,
                              secondaryLabel: "Retour",
                              secondaryAction: showStep2
                            },
                            "bottom-right"
                          );
                        };

                        const showStep2 = () => {
                          triggerAxisMessage(
                            <div className="flex flex-col gap-3">
                              <span className="font-extrabold text-white text-lg lg:text-xl">Écoute bien ⚡</span>
                              <span className="text-white text-[15px]">Le principe est simple…<br/>Le ou les produits que tu as ajoutés dans ta boutique…</span>
                              <span className="font-bold text-white px-2 py-1 rounded w-fit">vont travailler pour toi ⚙️</span>
                            </div>,
                            "guiding",
                            15000,
                            {
                              label: "Suivant ➔",
                              action: showStep3,
                              secondaryLabel: "Retour",
                              secondaryAction: () => {
                                triggerAxisMessage(
                                  "Bien joué ⚡\nMaintenant… on passe à l’étape où tu vas gagner tes premiers gains 💸\nTu veux que je te montre comment ça marche ?",
                                  "success",
                                  15000,
                                  {
                                    label: "Let's go 💸",
                                    action: showStep2
                                  },
                                  "bottom-right"
                                );
                              }
                            },
                            "bottom-right"
                          );
                        };

                        showStep2();
                      }
                    },
                    "bottom-right"
                  );
                }, 10000);
            }, { once: true });
          }
        },
        "bottom-right"
      );
    }, 1500);
  }, [session, userProfile, triggerAxisMessage]);

  useEffect(() => {
    if (!isReady || !session) return;

    const handleForceWelcome = () => {
      localStorage.setItem('mz_axis_welcomed', 'true');
      sessionStorage.setItem('mz_axis_guide_active', 'true');
      startGuide();
    };

    window.addEventListener('mz-force-welcome-guide', handleForceWelcome);

    // Lancement automatique du guide uniquement si ce n'est pas déjà fait
    if (localStorage.getItem('mz_axis_welcomed') !== 'true') {
      const isInstalled = localStorage.getItem('mz_pwa_installed') === 'true' || 
                          window.matchMedia('(display-mode: standalone)').matches || 
                          ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
                          
      const isPromptDismissed = sessionStorage.getItem('mz_pwa_prompt_dismissed') === 'true';

      const runOnce = () => {
        localStorage.setItem('mz_axis_welcomed', 'true');
        sessionStorage.setItem('mz_axis_guide_active', 'true');
        startGuide();
      };

      if (isInstalled || isPromptDismissed) {
         runOnce();
      } else {
         // On attend la fermeture (ou la fin) de la bannière PWA
         window.addEventListener('mz-pwa-handled', runOnce, { once: true });
      }
    }

    return () => {
      window.removeEventListener('mz-force-welcome-guide', handleForceWelcome);
    };
  }, [isReady, session, startGuide]);

  return null;
};
