import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, Zap, X, Rocket, 
  ShieldAlert, BadgeCheck,
  TrendingUp, ArrowUpRight, Clock, AlertCircle,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../services/supabase.ts';

interface MZPlusFlashOfferOverlayProps {
  profile: any;
  onUpgrade: () => void;
  onClose?: () => void;
  isFullPage?: boolean;
}

const CHECKOUT_LINK = "https://mzplus.mychariow.shop/prd_iwhpro/checkout";

const LiveActivityPulse = () => {
  const [activities, setActivities] = useState([
    { id: 1, text: "Gains en cours : +45,000 FCFA (RPA Protocol)", user: "Moussa.K", type: 'earn' },
    { id: 2, text: "LICENCE ÉLITE ACTIVÉE", user: "Sarah_Elite", type: 'upgrade' },
    { id: 3, text: "Extraction de commissions terminée", user: "Membre_#482", type: 'success' },
    { id: 4, text: "Nouveau membre Premium : Amadou", user: "Amadou-CI", type: 'upgrade' },
  ]);

  useEffect(() => {
    const names = ["Koffi", "Yasmine", "Omar", "Binta", "Fatou", "Dimitri", "Ibrahim", "Malick", "Assane"];
    const actions = [
      "vient d'activer le protocole RPA",
      "génère sa 3ème commission",
      "débloque l'accès Luna Expert",
      "encaisse +12,500 FCFA",
      "vient de rejoindre le cercle Élite"
    ];

    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        text: `${actions[Math.floor(Math.random() * actions.length)]}`,
        user: names[Math.floor(Math.random() * names.length)],
        type: Math.random() > 0.6 ? 'upgrade' : 'earn'
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 65000); // reduced frequency to 65 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-24 left-6 z-[100] pointer-events-none hidden xl:block w-80">
      <div className="text-[8px] font-black tracking-[0.3em] text-purple-500 mb-4 animate-pulse">LIVE ACCESS STREAM // MZ+ NETWORK</div>
      <AnimatePresence mode="popLayout">
        {activities.map((act) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
            className="mb-3 p-4 bg-black/80 backdrop-blur-3xl border-l-2 border-purple-600 rounded-r-xl flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.type === 'upgrade' ? 'bg-purple-600 text-white' : 'bg-emerald-600/20 text-emerald-500'}`}>
              {act.type === 'upgrade' ? <Crown size={14} /> : <Zap size={14} />}
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest truncate">{act.user}</p>
              <p className="text-[11px] text-white/90 font-bold leading-tight truncate">{act.text}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const GlitchText = ({ text }: { text: string }) => (
  <span className="relative inline-block">
    <span className="relative z-10">{text}</span>
    <motion.span 
      animate={{ opacity: [0, 0.5, 0], x: [-2, 2, -2] }}
      transition={{ repeat: Infinity, duration: 0.2 }}
      className="absolute top-0 left-0 -z-10 text-purple-600 blur-[2px]"
    >
      {text}
    </motion.span>
  </span>
);

export const MZPlusFlashOfferOverlay: React.FC<MZPlusFlashOfferOverlayProps> = ({ profile, onUpgrade, onClose, isFullPage = false }) => {
  const [config, setConfig] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [proofs, setProofs] = useState<any[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; label: string } | null>(null);
  const [recentPremiumJoin, setRecentPremiumJoin] = useState<{ name: string; city: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const NAMES = [
      "Marc", "Sophie", "Thomas", "Fatou", "Lucas", "Elena", "Ibrahim", "Julie", "Kevin", "Sarah", "Yann", "Mélanie", "Oumar", "Awa", "Koffi",
      "Abdoulaye", "Adama", "Aïcha", "Alain", "Alexandre", "Alice", "Amadou", "Aminata", "Antoine", "Arthur", "Assane", "Audrey", "Aurélien", "Bakary", "Béatrice",
      "Benoît", "Bertrand", "Bineta", "Boubacar", "Camille", "Cédric", "Chantal", "Charles", "Cheikh", "Christian", "Claire", "Claude", "Côme", "Corinne", "Damien",
      "Daniel", "David", "Denis", "Désiré", "Diakalya", "Dieudonné", "Djibril", "Dominique", "Édith", "Édouard", "Élisabeth", "Élodie", "Émile", "Emmanuel", "Éric",
      "Étienne", "Eugène", "Fabien", "Fabrice", "Fanta", "Félix", "Fernand", "Florent", "François", "Franck", "Frédéric", "Gabriel", "Gaston", "Georges", "Gérard",
      "Gilbert", "Gilles", "Grégoire", "Guillaume", "Guy", "Habib", "Hélène", "Henri", "Hervé", "Hubert", "Hugues", "Idrissa", "Irène", "Isabelle", "Issa", "Jacques",
      "Jean", "Jeanne", "Jérôme", "Joachim", "Joël", "Joseph", "Josiane", "Jules", "Julien", "Justine", "Karim", "Lamine", "Laurent", "Léopold", "Louis", "Luc", "Lucien",
      "Mamadou", "Marcel", "Marie", "Martine", "Mathieu", "Maurice", "Michel", "Modibo", "Monique", "Moussa", "Nathalie", "Nicolas", "Noël", "Odette", "Olivier", "Ousmane",
      "Pascal", "Patrice", "Patrick", "Paul", "Philippe", "Pierre", "Raymond", "René", "Richard", "Robert", "Roger", "Roland", "Samba", "Samuel", "Sébastien", "Serge",
      "Seydou", "Simon", "Stéphane", "Sylvain", "Thérèse", "Thierry", "Tidiane", "Victor", "Vincent", "Xavier", "Yacouba", "Yves", "Zacharie", "Zoé", "Abiba", "Bakari",
      "Bourema", "Clarisse", "Diarra", "Evelyne", "Fadel", "Gisèle", "Hamadou", "Inès", "Jocelyn", "Kamal", "Léonard", "Mariam", "Nafi", "Obi", "Pascaline", "Quentin",
      "Ramatou", "Salif", "Tidjani", "Ulrich", "Valentin", "Waly", "Yasmine", "Zadi", "Abel", "Bamba", "Célestine", "Drissa", "Enzo", "Félicité", "Gervais", "Honoré",
      "Ismaël", "Justin", "Kader", "Lila", "Mady", "Noémie", "Ondine", "Prudence", "Rémi", "Saliou", "Tania", "Urbain", "Viviane", "William", "Yohan", "Zénab",
      "Cyrille", "Loïc", "Maëlys", "Nathan", "Hugo", "Inès", "Jade", "Léa", "Léo", "Manon", "Maxime", "Nina", "Pauline", "Raphaël", "Sacha", "Théo", "Tom", "Yaniss",
      "Moussa", "Tidiane", "Kadiatou", "Abdou", "Sira", "Bakary", "Assa", "Madou", "Djeneba", "Sékou", "Lamine", "Aïssata", "Souleymane", "Aminata", "Boubacar",
      "Youssouf", "Mariame", "Adama", "Oumou", "Ibrahim", "Fanta", "Moussa", "Fatoumata", "Amadou", "Saliou", "Kadidia", "Abdoulaye", "Hawa", "Demba", "Rokia",
      "Mohamed", "Djénéibou", "Aliou", "Nanténin", "Sidi", "Sounkalo", "Oumar", "Batoma", "Drissa", "Assétou", "Mamadou", "Haby", "Ousmane", "Penda", "Boureima",
      "Cheick", "Awa", "Lassana", "Safiatou", "Gaston", "Bernadette", "Florentin", "Odile", "Hervé", "Chantal", "Didier", "Mireille", "Guy", "Colette", "Patrice",
      "Solange", "Thierry", "Geneviève", "André", "Marthe", "René", "Josiane", "Marcel", "Georgette", "Émile", "Raymonde", "Roland", "Lucienne", "Georges", "Yvonne",
      "Cyril", "Nadege", "Fabien", "Severine", "Loic", "Magali", "Samuel", "Aurore", "Xavier", "Vanessa", "Arnaud", "Estelle", "Sébastien", "Aurelie", "Guillaume",
      "Céline", "Ludovic", "Emilie", "Nicolas", "Sandrine", "Benoit", "Elodie", "Julien", "Julie", "Mathieu", "Audrey", "Romain", "Marine", "Adrien", "Laureen",
      "Koffi", "Ama", "Kwame", "Adjoa", "Kojo", "Akua", "Kwaku", "Yaa", "Yaw", "Afua", "Kofi", "Amma", "Kwasi", "Akosua", "Kwabena", "Abena", "Ekow", "Baaba",
      "Baako", "Bonsu", "Mensah", "Tetteh", "Annan", "Sarpong", "Boateng", "Mensah", "Owusu", "Appiah", "Asante", "Oppong", "Gyamfi", "Adu", "Sarfo", "Agyemang",
      "Dapaah", "Frimpong", "Osei", "Kusi", "Danso", "Acheampong", "Kyere", "Amponsah", "Badu", "Darko", "Asare", "Kyei", "Prempeh", "Fosu", "Boakye", "Kwarteng",
      "Zadi", "Gahé", "Kouassi", "Lou", "Yao", "Aman", "Tanoh", "N'Guessan", "Koné", "Coulibaly", "Traoré", "Fofana", "Bakayoko", "Bamba", "Ouattara", "Cissé",
      "Touré", "Keita", "Diallo", "Sow", "Bah", "Barry", "Cherif", "Camara", "Diaby", "Doumbia", "Sidibé", "Sangare", "Diakite", "Sanogo", "Diarra", "Sissoko",
      "Kamissoko", "Kanté", "Bagayoko", "Dembélé", "Sogoba", "Togola", "Tangara", "Mallé", "Samaké", "Coulibaly", "Sanogo", "Sangaré", "Maïga", "Dicko", "Dia",
      "Niang", "Wade", "Gueye", "Ndiaye", "Diop", "Fall", "Sarr", "Thiam", "Sall", "Ba", "Ly", "Kane", "Seck", "Mbow", "Ka", "Diaw", "Ngom", "Faye", "Diouf", "Samb",
      "Cisse", "Daffé", "Sakho", "Sow", "Tandia", "Gakou", "Fofana", "Sissoko", "Sidibe", "Traore", "Koita", "Dra", "Camara", "Keita", "Kante", "Dukureh", "Jatta"
    ];
    const CITIES = [
      "Paris", "Lyon", "Abidjan", "Dakar", "Bruxelles", "Genève", "Montréal", "Bordeaux", "Casablanca", "Douala", "Lomé", "Bamako",
      "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Lille", "Rennes", "Reims", "Saint-Étienne", "Le Havre", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne",
      "Yamoussoukro", "Bouaké", "San Pedro", "Korhogo", "Daloa", "Saint-Louis", "Thiès", "Kaolack", "Ziguinchor", "Mbour", "Rabat", "Marrakech", "Fès", "Agadir", "Tanger", "Yaoundé",
      "Libreville", "Port-Gentil", "Brazzaville", "Pointe-Noire", "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kisangani", "Kananga", "Ouagadougou", "Bobo-Dioulasso", "Niamey", "Zinder",
      "Nouakchott", "Conakry", "Cotonou", "Porto-Novo", "Libreville", "Antananarivo", "Tunis", "Sfax", "Sousse", "Bizerte", "Gabès", "Kairouan", "Gafsa", "Monastir"
    ];

    let simulationTimeout: NodeJS.Timeout;

    const showJoin = () => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      setRecentPremiumJoin({ name, city });
      
      // Clear after 5 seconds
      setTimeout(() => setRecentPremiumJoin(null), 5000);

      // Schedule next one between 120 and 300 seconds (reduced frequency)
      const nextDelay = Math.floor(Math.random() * (300000 - 120000 + 1)) + 120000;
      simulationTimeout = setTimeout(showJoin, nextDelay);
    };

    // Initial delay of 120 seconds instead of 15 seconds to be extremely quiet
    const initialTimeout = setTimeout(showJoin, 120000);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(simulationTimeout);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offerRes, proofsRes] = await Promise.all([
          supabase.from('mz_flash_offer_v2').select('*').eq('id', 'flash-offer-global').maybeSingle(),
          supabase.from('mz_premium_proofs').select('*').order('created_at', { ascending: false })
        ]);
        if (proofsRes.data) setProofs(proofsRes.data);
        if (offerRes.data?.is_active) {
          setConfig(offerRes.data);
          setIsVisible(true);
        } else if (isFullPage) {
          setConfig({ is_active: true, price_promo: '15000', price_normal: '20000', show_timer: true, ends_at: new Date(Date.now() + 86400000).toISOString() });
          setIsVisible(true);
        }
      } catch (err) {}
    };
    fetchData();
  }, [profile?.id, isFullPage]);

  useEffect(() => {
    if (!config?.ends_at || !config?.show_timer) return;
    const interval = setInterval(() => {
      const dist = new Date(config.ends_at).getTime() - Date.now();
      if (dist < 0) { setTimeLeft(null); return; }
      setTimeLeft({
        hours: Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((dist % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [config]);

  if (isDismissed || !isVisible || !config) return null;

  const handleUpgrade = () => {
    window.open(CHECKOUT_LINK, '_blank');
    if (onUpgrade) onUpgrade();
  };

  return (
    <div className="fixed inset-0 z-[9000] bg-black overflow-y-auto selection:bg-purple-600 font-sans text-white">
      {/* IMMERSIVE BG: NOISE AND DEPTH */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#2e1065_0%,#000000_80%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        {/* SCANLINES FOR TECH FEEL */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
        {/* FLOATING PARTICLES (CSS) */}
        <div className="particles-container absolute inset-0 opacity-20" />
      </div>

      <LiveActivityPulse />

      {/* Floating Premium Join Notification (Bottom Left) */}
      <AnimatePresence>
        {recentPremiumJoin && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.8 }}
            className="fixed bottom-6 left-6 z-[10000] flex items-center gap-4 bg-black/90 backdrop-blur-2xl border border-purple-500/30 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(168,85,247,0.1)_inset]"
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                <Crown size={20} className="animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
            </div>
            
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest leading-none mb-1">Passage à l'Élite</p>
              <p className="text-sm font-bold text-white/90">
                <span className="text-white">{recentPremiumJoin.name}</span>
                <span className="text-neutral-500 text-xs font-medium ml-1">({recentPremiumJoin.city})</span>
              </p>
              <p className="text-[10px] text-neutral-400 font-medium italic">Vient de rejoindre MZ+ Premium</p>
            </div>

            <button 
              onClick={() => setRecentPremiumJoin(null)}
              className="ml-2 p-1 text-neutral-600 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAV: MINIMAL & PRO */}
      <nav className="fixed top-0 left-0 right-0 z-[100] p-6 flex justify-between items-center max-w-7xl mx-auto">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-xl shadow-[0_0_30px_rgba(147,51,234,0.6)]"><Crown size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] hidden md:block">MZ+ ELITE INTERFACE // V2.4</span>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const refParam = profile?.referral_code ? `?ref=${profile.referral_code}` : '';
              const directLink = `${window.location.origin}/offreflashpremium${refParam}`;
              navigator.clipboard.writeText(directLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
            }}
            className={`group p-2 flex items-center gap-2 border rounded-full pr-5 transition-all duration-300 opacity-5 hover:opacity-100 focus:opacity-100 ${
              copied 
                ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                : 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-colors duration-300 ${
              copied ? 'bg-emerald-600/30 text-emerald-400' : 'bg-purple-600/30 text-purple-400'
            }`}>
              {copied ? (
                <span className="font-bold text-xs">✓</span>
              ) : (
                <ArrowUpRight size={14} />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {copied ? 'Lien Copié !' : 'Copier Lien Direct'}
            </span>
          </button>

          <button 
            onClick={() => {
              const refParam = profile?.referral_code ? `?ref=${profile.referral_code}` : '';
              const directLink = `${window.location.origin}/offreflashpremium${refParam}`;
              const shareText = `👑 Découvre le protocole d'élite MZ+ Premium et active tes revenus passifs automatiques dès aujourd'hui ! Rejoins la tribu ici :\n\n${directLink}`;
              const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
              window.open(whatsappLink, '_blank');
            }}
            className="group p-2 flex items-center gap-2 border rounded-full pr-5 bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30 shadow-[0_0_15px_rgba(34,197,94,0.1)] transition-all duration-300 select-none focus:outline-none opacity-5 hover:opacity-100 focus:opacity-100"
          >
            <div className="p-1.5 rounded-full bg-green-600/30 text-green-400 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.451 4.793 1.452 5.518 0 10.006-4.486 10.009-10.002.002-2.673-1.037-5.184-2.931-7.081C16.634 1.626 14.127.585 11.45.585 5.928.585 1.442 5.071 1.439 10.59c-.001 1.785.467 3.53 1.353 5.074l-1.012 3.693 3.795-.995zM18.23 15.65c-.299-.15-1.771-.873-2.046-.974-.275-.101-.476-.15-.676.15-.2.3-.776.974-.951 1.173-.175.2-.35.225-.65.075-.3-.15-1.263-.465-2.403-1.482-.888-.793-1.488-1.771-1.663-2.07-.175-.3-.019-.463.131-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.628-.926-2.228-.243-.585-.491-.507-.676-.516-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8 1.05-.275.975-1.05 3.074-1.05 3.174 0 .1.1.2.25.3.15.1.728 1.112 1.562 1.83 1.01 1.05 1.884 1.1 2.385 1.1l.6.05c1.4.1 2 .2 2.385.1l.6-.35c.34-.15.34-.65.25-.8l-.35-.2z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Partager sur WhatsApp</span>
          </button>

          <button onClick={() => onClose ? onClose() : setIsDismissed(true)} className="group p-2 flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pr-6 hover:bg-white/10 transition-all border-dashed">
            <div className="p-1 bg-white/10 rounded-full"><X size={16} /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-white">Fermer la session</span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT RAILS */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-40 pb-64 space-y-48">
        
        {/* 1. HERO: DESTRUCTIVE HEADLINE */}
        <section ref={heroRef} className="text-center space-y-12 md:space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'circOut' }}
            className="space-y-6 md:space-y-10"
          >
            <div className="inline-block px-4 md:px-8 py-2 md:py-3 bg-white/5 border border-white/10 rounded-full text-purple-400 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.6em] mb-2 md:mb-6 animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.1)]">
               EST-CE QUE TU VALIDES TON POTENTIEL ?
            </div>
            
            <h1 className="text-3xl sm:text-6xl md:text-8xl lg:text-[9.5rem] font-black italic tracking-tighter leading-[1.1] md:leading-[0.85] uppercase select-none break-words px-2">
              <span className="text-white">COMMENT GÉNÉRER</span> <br /> 
              <span className="text-purple-500 drop-shadow-[0_0_40px_rgba(168,85,247,0.8)] inline-block transform -skew-x-6">
                <GlitchText text="+1.000.000" />
              </span> <br /> 
              <span className="text-white">FCFA / MOIS AVEC MZ+</span>
            </h1>

            <div className="space-y-4 md:space-y-6">
              <p className="text-lg sm:text-xl md:text-4xl lg:text-5xl text-neutral-200 font-black max-w-5xl mx-auto leading-tight italic tracking-tighter px-4">
                "Tu es motivé, tu veux réussir en ligne… <br className="hidden md:block" /> 
                <span className="text-purple-500">mais tu sais pas comment ?</span>"
              </p>
            </div>
          </motion.div>

          {/* CTA: MASSIVE IMPACT */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="relative flex flex-col items-center gap-8 md:gap-12 px-4"
          >
             <button 
               onClick={handleUpgrade}
               className="group relative w-full md:w-auto px-8 md:px-16 py-6 md:py-10 bg-white text-black rounded-2xl md:rounded-[2.5rem] font-black uppercase text-sm md:text-2xl tracking-[0.2em] md:tracking-[0.4em] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(168,85,247,0.3)]"
             >
                <div className="absolute inset-0 bg-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 group-hover:text-white transition-colors flex items-center justify-center gap-4 md:gap-6">
                  DÉBLOQUER MA RÉUSSITE <ArrowUpRight size={24} className="md:w-8 md:h-8" />
                </span>
             </button>
             
             <div className="flex flex-col items-center gap-4">
                <div className="flex gap-6 md:gap-10 items-center justify-center grayscale opacity-40">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4 md:h-6" />
                   <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 md:h-6" />
                   <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3 md:h-4" />
                </div>
                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-neutral-600 text-center">Paiement ultra-sécurisé par cryptage AES-256</div>
             </div>

             {/* INDICATEUR DE DEFILEMENT POUR REVELER LA SUITE DE LA PAGE */}
             <div className="pt-16 flex flex-col items-center gap-3 select-none">
                <span className="text-[10px] sm:text-xs font-black tracking-[0.3em] text-purple-400 uppercase animate-pulse">
                   ⚡ Défiler pour découvrir la suite du programme
                </span>
                <motion.div 
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-6 h-10 border-2 border-purple-500/30 rounded-full flex justify-center p-1"
                >
                   <div className="w-1.5 h-2 bg-purple-500 rounded-full" />
                </motion.div>
             </div>
          </motion.div>
        </section>

        {/* 2. THE FRUSTRATION: WHY STAGNATE? */}
        <section className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8 md:space-y-12 text-center md:text-left"
            >
               <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase italic leading-none tracking-tighter text-center">
                 L'ERREUR FATALE <br /> <span className="text-neutral-600">DU NIVEAU STANDARD.</span>
               </h2>
               <div className="grid md:grid-cols-3 gap-6 md:gap-10">
                  {[
                    { t: "L'invisibilité algorithmique", d: "Sans Premium, tes chances de voir les opportunités à 6 chiffres sont divisées par 10." },
                    { t: "Le plafond de verre", d: "Tu es limité à des miettes pendant que les membres Élite dévorent le marché." },
                    { t: "L'isolement total", d: "Avancer seul est le chemin le plus court vers l'abandon." }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center md:items-start gap-4 md:gap-6 group text-center md:text-left">
                       <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 border border-white/10 rounded-xl md:rounded-[1.5rem] flex items-center justify-center shrink-0 group-hover:bg-red-600/10 group-hover:border-red-500/50 transition-all shadow-xl">
                          <AlertCircle size={24} className="text-red-500 md:w-7 md:h-7" />
                       </div>
                       <div className="space-y-0.5 md:space-y-1">
                          <h4 className="text-lg md:text-xl font-black uppercase italic text-white/90">{item.t}</h4>
                          <p className="text-xs md:text-base text-neutral-500 font-medium leading-relaxed">{item.d}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
        </section>

        {/* 3. THE CLAN: SOCIAL PRESSURE & EMOTION */}
        <section className="space-y-12 md:space-y-24">
            <div className="text-center space-y-4 md:space-y-6">
               <h2 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase italic tracking-tighter decoration-purple-600 underline underline-offset-4">LE CERCLE DES GAGNANTS</h2>
               <p className="text-neutral-500 text-xs sm:text-sm md:text-xl font-bold max-w-xl mx-auto uppercase tracking-widest px-4">
                  Ce n'est plus toi contre le monde. <br className="hidden md:block" /> C'est toi avec les meilleurs.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 px-2 lg:px-0">
               {proofs.slice(0, 3).map((proof, i) => (
                 <motion.div 
                   key={proof.id}
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   viewport={{ once: true }}
                   className="group relative h-[450px] md:h-[600px] rounded-3xl md:rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl cursor-pointer"
                   onClick={() => setFullscreenImage({ url: proof.after_image_url, label: proof.name })}
                 >
                    <img src={proof.after_image_url} alt="Result" className="w-full h-full object-cover grayscale opacity-50 md:opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-6 md:top-8 right-6 md:right-8">
                       <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center text-white"><Maximize2 size={20} className="md:w-6 md:h-6" /></div>
                    </div>

                    <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:left-10 space-y-2 md:space-y-4">
                       <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-1 h-6 md:h-8 bg-purple-600" />
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-[0.1em] text-purple-400">{proof.name}</p>
                             <p className="text-2xl md:text-4xl font-mono font-black italic">+{proof.after_amount} FCFA</p>
                          </div>
                       </div>
                       <p className="text-xs md:text-sm text-neutral-400 font-medium italic line-clamp-2 md:line-clamp-3 leading-relaxed">
                          "{proof.comment || "Premium n'est pas un abonnement, c'est un accélérateur de destin."}"
                       </p>
                    </div>
                 </motion.div>
               ))}
            </div>
        </section>

        {/* 4. FINAL CLOSURE: ZERO-DARK-30 */}
        <section className="relative overflow-hidden group py-16 md:py-32 rounded-3xl md:rounded-[5rem] border-2 border-purple-500/50 bg-black text-center space-y-12 md:space-y-16 shadow-[0_0_150px_rgba(139,92,246,0.2)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#000000_100%)] opacity-50" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 px-4 md:px-0" />
            
            <div className="max-w-4xl mx-auto space-y-8 md:space-y-10 px-4 md:px-8 relative z-10">
                <div className="flex justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="w-16 h-16 md:w-24 md:h-24 bg-purple-600 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.5)]"
                  >
                    <Crown size={32} className="text-white md:w-[50px] md:h-[50px]" />
                  </motion.div>
                </div>

                <h3 className="text-4xl sm:text-5xl md:text-9xl font-black uppercase tracking-tighter italic leading-none break-words">
                  DERNIER <br /><span className="text-purple-500 italic drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">APPEL.</span>
                </h3>
                
                <p className="text-lg md:text-3xl font-bold text-neutral-300 leading-tight italic px-2">
                  "Beaucoup regardent cette page. Très peu osent vraiment évoluer. <br className="hidden md:block" />
                  <span className="text-white underline decoration-purple-600 underline-offset-4 md:underline-offset-8">Lequel des deux es-tu aujourd'hui ?</span>"
                </p>

                <div className="pt-6 md:pt-10 space-y-8 md:space-y-12">
                    <div className="flex flex-col items-center gap-4 md:gap-6">
                        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                           <span className="text-neutral-700 line-through text-2xl md:text-4xl font-mono italic">{config.price_normal} FCFA</span>
                           <span className="text-5xl sm:text-6xl md:text-[9rem] font-mono font-black italic text-white tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.1)] leading-none">
                             {config.price_promo} <span className="text-xl md:text-2xl text-purple-600 italic uppercase">FCFA</span>
                           </span>
                        </div>
                        {timeLeft && (
                          <div className="flex gap-4 md:gap-6 font-mono text-xl md:text-5xl text-red-600 font-black tracking-widest bg-white/5 px-6 md:px-10 py-3 md:py-6 rounded-2xl md:rounded-3xl border border-red-900/50 animate-pulse">
                            <span>{timeLeft.hours.toString().padStart(2, '0')}</span> :
                            <span>{timeLeft.minutes.toString().padStart(2, '0')}</span> :
                            <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
                          </div>
                        )}
                    </div>

                    <button 
                      onClick={handleUpgrade}
                      className="group w-full max-w-2xl mx-auto py-8 md:py-12 bg-white text-black rounded-[2rem] md:rounded-[3rem] font-black uppercase text-base md:text-3xl tracking-[0.2em] md:tracking-[0.4em] shadow-[0_20px_100px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 md:gap-8 relative overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                       PASSER AU NIVEAU ÉLITE 
                       <Rocket size={32} className="md:w-[40px] md:h-[40px] group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                    </button>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 opacity-40 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-neutral-500">
                       <span className="flex items-center gap-2 md:gap-3"><BadgeCheck size={12} className="md:w-[14px] md:h-[14px]" /> Paiement unique</span>
                       <span className="flex items-center gap-2 md:gap-3"><Clock size={12} className="md:w-[14px] md:h-[14px]" /> Accès immédiat</span>
                       <span className="flex items-center gap-2 md:gap-3"><ShieldAlert size={12} className="md:w-[14px] md:h-[14px]" /> 100% sécurisé</span>
                    </div>
                </div>
            </div>
        </section>

      </div>

      <AnimatePresence>
        {fullscreenImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[20000] flex flex-col items-center justify-center p-6 bg-black/98 backdrop-blur-3xl" 
            onClick={() => setFullscreenImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, filter: 'blur(10px)' }}
              animate={{ scale: 1, y: 0, filter: 'blur(0px)' }}
              className="relative w-full max-w-[500px] aspect-[9/16] rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.3)] border-2 border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={fullscreenImage.url} alt="Proof" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black to-transparent">
                 <div className="flex items-center gap-4">
                    <div className="w-1.5 h-12 bg-purple-600" />
                    <div>
                       <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">{fullscreenImage.label}</p>
                       <p className="text-white text-2xl font-black italic">RÉSULTAT VÉRIFIÉ // MZ+ NETWORK</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 0px; }
        @keyframes particles {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        .particles-container::before {
          content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background-image: radial-gradient(circle, #fff 1px, transparent 1px);
          background-size: 50px 50px; animation: particles 20s linear infinite;
        }
      `}} />
    </div>
  );
};
