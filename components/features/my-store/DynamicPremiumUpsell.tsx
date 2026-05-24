import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Target } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Product } from "../../../types";

interface DynamicPremiumUpsellProps {
  totalSales: number;
  totalVisits: number;
  productsInStore: Product[];
  onUpgradeClick: () => void;
}

export const DynamicPremiumUpsell: React.FC<DynamicPremiumUpsellProps> = ({
  totalSales,
  totalVisits,
  productsInStore,
  onUpgradeClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate dynamic messages based on store state
  const messages = React.useMemo(() => {
    const cases = [];

    // Base Case 1: General scaling
    cases.push({
      title: "Business Intelligence",
      heading: "Épurer tes gains avec MZ+ Elite",
      text: "Adopte les stratégies de scalabilité pour automatiser ta boutique aujourd'hui.",
      cta: "Upgrader vers l'Elite",
      icon: <Sparkles size={16} />,
      color: "emerald"
    });

    // Case 2: No results yet, but store is set up
    if (totalSales === 0) {
      cases.push({
        title: "Le Succès est Proche",
        heading: "Leur boutique travaille pour eux",
        text: "Certains membres Premium étaient exactement à ta place il y a quelques semaines. Aujourd'hui, leur boutique travaille réellement pour eux.",
        cta: "Découvrir leurs secrets",
        icon: <Target size={16} />,
        color: "purple"
      });
      cases.push({
        title: "Juste un Ajustement",
        heading: "Ta première vente t'attend",
        text: "Tu es peut-être plus proche de ta première vente que tu ne le penses. Il te manque juste quelques ajustements que les membres Premium ont.",
        cta: "Rejoindre l'Elite",
        icon: <TrendingUp size={16} />,
        color: "blue"
      });
    }

    // Case 3: Having visits but not making (enough) sales
    if (totalVisits > 0 && totalSales === 0) {
      cases.push({
        title: "Optimisation de Conversion",
        heading: "Transforme tes visiteurs en clients",
        text: "Ta boutique reçoit des visites ! Découvre les méthodes Premium pour convertir ces visiteurs en vrais clients.",
        cta: "Maîtriser la conversion",
        icon: <TrendingUp size={16} />,
        color: "emerald"
      });
    }

    // Case 4: Product context (using a random product from store if available)
    if (productsInStore.length > 0) {
      const topProduct = productsInStore[0];
      cases.push({
        title: "Stratégie Produit",
        heading: "Explose tes ventes",
        text: `Ton produit "${topProduct.name}" reçoit de l'intérêt. Il faut juste que tu maîtrises comment transformer ses visiteurs en clients.`,
        cta: "Voir la stratégie",
        icon: <Target size={16} />,
        color: "orange"
      });

      if (productsInStore.length > 1) {
        const anotherProduct = productsInStore[1];
        cases.push({
          title: "Chiffre d'Affaires",
          heading: "Ils ont réussi avec ce produit",
          text: `Beaucoup de membres Premium ont généré des chiffres d'affaires incroyables grâce à "${anotherProduct.name}". Deviens membre Premium et accède aux stratégies qu'ils utilisent.`,
          cta: "Accéder aux stratégies",
          icon: <Sparkles size={16} />,
          color: "purple"
        });
      }
    }

    // New Marketing Cases
    cases.push({
      title: "Liberté Géographique",
      heading: "Travaille d'où tu veux",
      text: "Le niveau Premium n'est pas qu'une question d'argent, c'est une question de temps et de liberté. Automatise tout.",
      cta: "Activer l'automatisation",
      icon: <TrendingUp size={16} />,
      color: "blue"
    });

    cases.push({
      title: "Réseau d'Élite",
      heading: "Ton entourage définit ton succès",
      text: "En rejoignant l'Elite, tu intègres un cercle de gagnants qui se tirent vers le haut chaque jour.",
      cta: "Rejoindre le cercle",
      icon: <Sparkles size={16} />,
      color: "emerald"
    });

    cases.push({
      title: "Accélération Maximale",
      heading: "Pourquoi attendre des mois ?",
      text: "Ce que tu apprendras seul en 1 an, les membres Premium le maîtrisent en 2 semaines grâce à notre accompagnement.",
      cta: "Gagner du temps",
      icon: <TrendingUp size={16} />,
      color: "purple"
    });

    // Case 5: Emotional triggers
    cases.push({
      title: "Mentalité de Gagnant",
      heading: "Ne reste pas bloqué",
      text: "La vraie différence entre ceux qui stagnent et ceux qui explosent leurs ventes, c'est l'information. Ne passe pas à côté.",
      cta: "Débloquer l'information",
      icon: <Target size={16} />,
      color: "red"
    });

    cases.push({
      title: "Vision Mondiale",
      heading: "L'Afrique n'est que le début",
      text: "Avec les stratégies MZ+, tu peux cibler des clients partout dans le monde. Ne te limite plus localement.",
      cta: "Voir l'horizon",
      icon: <TrendingUp size={16} />,
      color: "blue"
    });

    cases.push({
      title: "Indépendance Totale",
      heading: "Ton propre patron",
      text: "Arrête de travailler pour les rêves des autres. Construis ton propre empire dès aujourd'hui avec MZ+ Elite.",
      cta: "Passer à l'action",
      icon: <Sparkles size={16} />,
      color: "emerald"
    });

    return cases;
  }, [totalSales, totalVisits, productsInStore]);

  const [isPaused, setIsPaused] = useState(false);

  // Rotate messages gently (every 15 seconds)
  useEffect(() => {
    if (messages.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [messages.length, isPaused]);

  const currentMessage = messages[currentIndex];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return {
          bgBlur: 'bg-purple-500/10 group-hover:bg-purple-500/20',
          iconBg: 'bg-purple-500/10 text-purple-500',
          buttonHover: 'hover:bg-purple-400 hover:text-white hover:shadow-purple-500/30'
        };
      case 'blue':
        return {
          bgBlur: 'bg-blue-500/10 group-hover:bg-blue-500/20',
          iconBg: 'bg-blue-500/10 text-blue-500',
          buttonHover: 'hover:bg-blue-400 hover:text-white hover:shadow-blue-500/30'
        };
      case 'orange':
        return {
          bgBlur: 'bg-orange-500/10 group-hover:bg-orange-500/20',
          iconBg: 'bg-orange-500/10 text-orange-500',
          buttonHover: 'hover:bg-orange-400 hover:text-white hover:shadow-orange-500/30'
        };
      case 'red':
        return {
          bgBlur: 'bg-rose-500/10 group-hover:bg-rose-500/20',
          iconBg: 'bg-rose-500/10 text-rose-500',
          buttonHover: 'hover:bg-rose-500 hover:text-white hover:shadow-rose-500/30'
        };
      case 'emerald':
      default:
        return {
          bgBlur: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
          iconBg: 'bg-emerald-500/10 text-emerald-500',
          buttonHover: 'hover:bg-emerald-400 hover:text-black hover:shadow-emerald-500/30'
        };
    }
  };

  const colorStyles = getColorClasses(currentMessage.color);

  return (
    <div 
      className="px-6 sm:px-8 mt-16 pb-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="p-8 sm:p-10 rounded-[40px] bg-white/[0.02] border border-white/[0.04] relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] transition-all duration-1000 ${colorStyles.bgBlur}`}></div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-500 ${colorStyles.iconBg}`}>
                {currentMessage.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 truncate">
                {currentMessage.title}
              </span>
            </div>
            
            <h4 className="text-2xl font-black text-white italic leading-[1.1] uppercase mb-5 tracking-tighter max-w-[280px]">
              {currentMessage.heading}
            </h4>
            
            <p className="text-[12px] text-white/40 font-medium leading-relaxed mb-10 max-w-[280px]">
              {currentMessage.text}
            </p>
            
            <button
              onClick={onUpgradeClick}
              className={`w-full py-5 rounded-[24px] bg-white text-black font-black uppercase text-[11px] tracking-[0.3em] transition-all duration-300 shadow-2xl ${colorStyles.buttonHover}`}
            >
              {currentMessage.cta}
            </button>

            {/* Progress indicator */}
            <div className="mt-6 flex justify-center gap-1.5">
              {messages.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    idx === currentIndex ? 'w-6 bg-white/40' : 'w-1 bg-white/10'
                  }`}
                />
              ))}
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 15, ease: "linear" }}
              key={`progress-${currentIndex}`}
              className="absolute bottom-0 left-0 h-1 bg-white/20"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
