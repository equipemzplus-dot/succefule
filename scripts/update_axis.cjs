const fs = require('fs');
let content = fs.readFileSync('components/features/axis/AxisGuideFlow.tsx', 'utf8');

const regex = /action: \(\) => \{\s+triggerAxisMessage\(\s+<div className="flex flex-col gap-3">\s+<span className="font-extrabold text-\[#10b981\] text-lg">Écoute bien ⚡<\/span>[\s\S]*?,\s+"bottom-right"\s*\);\s+\}\s+\},\s+"bottom-right"\s*\);\s+\}, 10000\);/m;

const replacementText = `action: () => {
                        const showStep4 = () => {
                          triggerAxisMessage(
                            <div className="flex flex-col gap-3">
                              <span className="font-extrabold text-[#10b981] text-lg">Et le meilleur ? 🎯</span>
                              <span className="text-white/90">Ton argent s'affiche sur ton solde en <span className="text-emerald-400 font-bold">temps réel ⚡</span></span>
                              <span className="text-white/90">Tu retires quand tu veux… directement sur ton <span className="text-[#f59e0b] font-black tracking-wide">Mobile Money 📱💸</span></span>
                            </div>,
                            "success",
                            15000,
                            {
                              label: "C'est parti 🔥",
                              action: () => {
                                // Hide current axis for 5s, then show the final one
                                setTimeout(() => {
                                  triggerAxisMessage(
                                    <div className="flex flex-col gap-3">
                                      <span className="font-extrabold text-[#10b981]">C’est le moment ⚡</span>
                                      <span className="text-white/90">Faire exploser tes ventes...<br/>Clique sur <span className="text-[#818cf8] font-black uppercase bg-[#6366f1]/20 px-2 py-0.5 rounded">Promouvoir</span> et partage ton produit 📲💸</span>
                                    </div>,
                                    "action",
                                    20000,
                                    undefined,
                                    "bottom-right"
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
                              <span className="text-white/90">Tu les partages autour de toi ou sur tes <span className="font-bold text-blue-400">réseaux sociaux 🌐</span>…</span>
                              <span className="text-white/90">Chaque fois que quelqu’un achète grâce à toi…</span>
                              <span className="font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-lg w-fit">tu gagnes une commission 💰✨</span>
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
                              <span className="font-extrabold text-[#10b981] text-lg">Écoute bien ⚡</span>
                              <span className="text-white/90">Le principe est simple…<br/>Le ou les produits que tu as ajoutés dans ta boutique…</span>
                              <span className="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded w-fit">vont travailler pour toi ⚙️</span>
                            </div>,
                            "guiding",
                            15000,
                            {
                              label: "Suivant ➔",
                              action: showStep3,
                              secondaryLabel: "Retour",
                              secondaryAction: () => {
                                triggerAxisMessage(
                                  "Bien joué ⚡\\nMaintenant… on passe à l’étape où tu vas gagner tes premiers gains 💸\\nTu veux que je te montre comment ça marche ?",
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
                }, 10000);`;
                
if(content.match(regex)) {
    content = content.replace(regex, replacementText);
    fs.writeFileSync('components/features/axis/AxisGuideFlow.tsx', content);
    console.log("Success");
} else {
    console.log("Not matched");
}
