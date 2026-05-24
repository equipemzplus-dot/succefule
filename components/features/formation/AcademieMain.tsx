
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Lock, 
  Crown, 
  Zap, 
  ShieldCheck, 
  Loader2, 
  Target,
  Rocket,
  ArrowRight,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Unlock,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { useAxis } from '../axis/AxisProvider.tsx';
import { supabase } from '../../../services/supabase.ts';
import { UserProfile, Formation, TabId } from '../../../types.ts';
import { TextFormationReader } from './TextFormationReader.tsx';

interface AcademieMainProps {
  profile: UserProfile | null;
  onSwitchTab: (id: TabId) => void;
}

const PurpleText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span 
    className={`inline-block ${className}`}
    style={{ 
      background: 'linear-gradient(to right, #e879f9, #a855f7, #6366f1)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
    }}
  >
    {children}
  </span>
);

export const AcademieMain: React.FC<AcademieMainProps> = ({ profile, onSwitchTab }) => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTextFormation, setActiveTextFormation] = useState<Formation | null>(null);
  const [pendingFormationId, setPendingFormationId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('formationId') || params.get('video') || params.get('vid');
  });
  const [activeFilter, setActiveFilter] = useState<'free' | 'premium'>('free');
  const [copied, setCopied] = useState(false);
  const isPremium = profile?.user_level === 'niveau_mz_plus';
  const isAdmin = false; // Désactivé à la demande de l'utilisateur

  const fetchFormations = async () => {
    const { data } = await supabase
      .from('mz_formations')
      .select('*')
      .order('order_index', { ascending: true });
    
    let finalData = data || [];
    
    // Inject default free text formation if not in DB
    const hasDefaultFree = finalData.some(f => f.id === 'default-free-text');
    const hasDefaultSystemFree = finalData.some(f => f.id === 'default-free-system');
    const defaultInjections = [];
    if (!hasDefaultFree) {
       defaultInjections.push({
           id: 'default-free-text',
           title: 'Comment choisir son produit ?',
           description: 'La méthode pour trouver le produit parfait pour commencer en affiliation',
           thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
           preview_url: '',
           max_preview_seconds: 0,
           created_at: new Date().toISOString(),
           is_free: true,
           content_type: 'text',
           text_content: `Félicitations à toi.\n\nSi tu es arrivé jusqu’ici…\nc’est que tu veux vraiment passer à un autre niveau.\n\nMais écoute bien…\n\nLa volonté seule ne suffit pas.\n\nÀ un moment, il faut passer à l’action.\n\nEt ça tombe bien…\n\nParce qu’ici, tu es au bon endroit.\nLe bon business.\nLa bonne communauté.\n\nUne communauté qui ne te motive pas juste…\nmais qui te fait agir.\n\n👉 La MZ+.\n\nMaintenant, parlons d’affiliation.\n\nÉcoute bien…\n\nLa plupart des gens ne gagnent pas en affiliation…\npas parce qu’ils sont incapables.\n\nMais parce qu’ils choisissent des produits qui ne leur correspondent pas.\n\nIci, dans la MZ+, on ne fait pas ça.\n\nOn choisit un produit qui nous correspond.\n\nUn produit que tu comprends.\nUn produit dont tu peux parler facilement.\nUn produit qui résout un vrai problème.\n\nParce que la vérité est simple :\n\n👉 Si tu ne comprends pas ce que tu vends… personne n’achète.\n\nDonc avant d’ajouter n’importe quel produit dans ta boutique…\n\nPrends le temps de regarder les détails.\nDe vraiment le comprendre.\n\nEt pose-toi cette question :\n\n“Est-ce que je peux recommander ce produit à quelqu’un de proche ?”\n\nSi la réponse est non…\n\nLaisse tomber.\n\nEt retiens bien ça :\n\nTu n’as pas besoin du produit parfait.\n\nTu as besoin d’un produit simple…\npour faire ta première vente.\n\nParce qu’ici…\n\nOn commence petit.\n\nMais on joue pour devenir grand.\n\nEt le jour où tu fais ta première vente…\n\nTout change.\n\nParce que tu comprends enfin le principe.\n\nImagine que tu vende\n\nUn produit qui te génère 2500 de comission …  10 fois en une semaine.\n\nC’est ça, le pouvoir.`
       });
    }

    if (!hasDefaultSystemFree) {
       defaultInjections.push({
           id: 'default-free-system',
           title: 'MZ+ — Le Système qui travaille pour toi',
           description: 'La Masterclass stratégique pour automatiser tes tunnels de vente TikTok et Facebook gratuitement',
           thumbnail_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop',
           preview_url: '',
           max_preview_seconds: 0,
           created_at: new Date().toISOString(),
           is_free: true,
           content_type: 'text',
           chapters: [
              { title: '🎯 Chapitres 1-3 : Le Choix du Produit & Sa Boutique' },
              { title: '🚀 Chapitres 4-7 : La Puissance de la Viralité TikTok & Facebook' },
              { title: '🎁 Bonus : 10 Scripts Prêts à Vendre (Produits de la Plateforme)' },
              { title: '💰 Chapitres 8-11 : Tunnels de Conversion & Automatisation' },
              { title: '👑 Chapitres 12-14 & Premium : Vision & Mindset d’Élite' }
           ],
           text_content: `# MZ+ — LE SYSTÈME QUI TRAVAILLE POUR TOI

## Formation Officielle • Millionaire Zone Plus

---

> 🎯 **« Les pauvres travaillent pour de l’argent. Les riches construisent des systèmes. »**

---

## 🌟 INTRODUCTION : L'Éveil de l'Affilié Stratégique

Bienvenue dans la **MZ+**.

Tu n’es plus ici par hasard. Chaque jour, des millions de personnes passent des heures sur TikTok, Facebook, Instagram et WhatsApp…

Mais une minorité comprend quelque chose d’important :

**Les réseaux sociaux sont devenus des machines à argent.**

Pendant que certains regardent des vidéos ou perdent leur temps, d’autres construisent des systèmes qui génèrent des ventes automatiquement.

La différence entre les deux ? **La stratégie.**

---

### 🗺️ Ce que tu vas maîtriser aujourd'hui :

✦ **Le Choix d’un produit intelligent** — Ne perds plus ton temps avec des offres périmées.

✦ **La Construction d'une boutique magnétique** — Qui convertit tes visiteurs en acheteurs.

✦ **La Viralité TikTok & Facebook** — 100% gratuite et ultra-ciblée.

✦ **La Création de contenus hypnotiques** — Qui suscitent instantanément le désir d’achat.

✦ **L'Automatisation complète** — Un système qui travaille de jour comme de nuit.

Un vrai membre MZ+ ne se contente pas de travailler dur... **Il travaille de façon extrêmement stratégique.**

---

## 📈 CHAPITRE 1 — LE NOUVEAU MONDE DU BUSINESS

Autrefois, pour lancer son entreprise, le parcours était un véritable parcours du combattant :

1. Louer un magasin physique extrêmement coûteux 🏢
2. Avoir d’immenses fonds de départ de plusieurs millions 💰
3. Employer du personnel et gérer des fiches de paie compliquées 👥
4. Prendre d'énormes risques financiers personnels 📉

### Aujourd’hui ? Tout a changé.

* Un simple téléphone portable 📱
* Une connexion internet fonctionnelle 🌐
* Et surtout : une **stratégie de conversion d'élite** 🧠

Ces trois éléments suffisent amplement à bâtir un empire digital depuis ta chambre.

TikTok peut transformer un parfait inconnu en vendeur d'élite du jour au lendemain. Facebook peut t'envoyer des centaines de clients qualifiés sans débourser un seul centime en publicité. Une seule vidéo bien structurée peut exploser et atteindre des dizaines de milliers de personnes qualifiées.

Le problème ? **La majorité des gens publient sans stratégie.** Ils travaillent beaucoup… mais sans système.

> **Le résultat de l'amateurisme :**
> ❌ Des heures de travail pour seulement quelques vues.
> ❌ Absolument aucune vente sur la boutique.
> ❌ Une perte rapide de motivation et un abandon prématuré.

La **MZ+** existe pour éradiquer ce problème. Ici, nous construisons des structures logiques. Parce qu’un système bien huilé continue d’attirer des clients et de réaliser des ventes **pendant que tu dors**.

---

## 🎯 CHAPITRE 2 — CHOISIR LE BON PRODUIT

Le produit est le carburant de ton business d'affiliation.

Un mauvais produit ou une offre trop complexe rendra tes efforts invisibles. En revanche, un bon produit ciblé peut propulser tes commissions d'un coup.

Tu n’as pas besoin de vendre 1000 produits différents. **Tu as besoin d’un unique produit hautement stratégique.**

### 🔍 Comment reconnaître un produit intelligent ?

Un produit d'affiliation à haute performance possède toujours ces caractéristiques :

✦ **Il résout une douleur profonde**, immédiate et concrète.

✦ **Il capte l’attention** de l'utilisateur en moins de 3 secondes.

✦ **Il provoque une émotion forte** (curiosité, ambition, soulagement).

✦ **Il est extrêmement facile à mettre en scène** en format vidéo.

✦ **Il est vendu à un tarif accessible** qui permet un achat impulsif.

### 🏆 Les catégories reines qui surperforment :

*   **Gains d'argent & Business :** Enseigner aux gens comment bâtir des revenus, automatiser un compte, générer de l'affiliation. C'est le créneau le plus rentable.
*   **Mindset & Productivité :** Motivation d'élite, gestion du temps, confiance en soi.
*   **Outils Pratiques :** Guides prêts à l'emploi, scripts rédigés, applications d'intelligence artificielle.

> 💡 **Le grand secret de la psychologie humaine :**
> Le cerveau humain n’achète jamais un produit brut. Il achète une **transformation radicale**.

*   ❌ *“Acheter une formation marketing de 10 heures”*
*   ✅ **“Le système exact pour encaisser tes premières commissions TikTok sans montrer ton visage”**
*   ❌ *“Télécharger un guide d’organisation PDF”*
*   ✅ **“La méthode infaillible pour libérer 2 heures par jour tout en doublant ton efficacité”**

---

## 🛒 CHAPITRE 3 — CONSTRUIRE UNE BOUTIQUE QUI CONVERTIT

Ta boutique en ligne est ton **soldat silencieux**. Même quand tu es déconnecté, elle doit parler avec assurance, convaincre et encaisser à ta place.

### ⚠️ Les erreurs fatales commises par 95% des débutants :

*   Mettre d'immenses blocs de texte froids et totalement illisibles.
*   Présenter un design brouillon et peu rassurant.
*   Créer une description technique ennuyeuse au lieu d'appuyer sur les bénéfices.
*   Oublier de mettre un bouton d'action évident et urgent.

### 🗺️ Les 4 piliers d’une boutique à forte conversion :

1. **Une image d'accroche ultra-pro :** Ton identité visuelle doit rassurer instantanément.
2. **Un titre magnétique :** Ne vends pas "Un Ebook", vends la promesse finale.
   * *Mauvais :* "Ebook PDF d'affiliation"
   * *Excellent :* **"Instagram Cashflow : Le plan de route pour générer tes premières commissions passives"**
3. **Une description axée sur le problème :** Écris en impliquant directement le lecteur. Décris sa frustration actuelle avec empathie, puis présente le produit comme l'unique pont vers sa liberté.
4. **Un appel à l'action (CTA) irrésistible :** Utilisez des verbes d'action puissants: *\"Rejoindre l'Élite maintenant\"*, *\"Lancer mon système automatique\"*, *\"Accéder à ma liberté financière\"*.

---

## 🛡️ CHAPITRE 4 — LE SECRET EXCLUSIF DES RÉSEAUX SOCIAUX

Pourquoi TikTok et Facebook sont des générateurs massifs de trafic en affiliation ?

Autrefois, pour toucher 100 000 prospects, une entreprise devait dépenser des millions en publicité télévisée.

Aujourd’hui, les algorithmes de recommandation organique se chargent de distribuer ton message à des milliers de personnes **gratuitement**.

Une seule vidéo qui touche le bon public peut :

✦ **Aspirer une vague massive de visiteurs qualifiés** directement vers ton lien.

✦ **Établir ta crédibilité** d'expert en un instant.

✦ **Encaisser des commissions automatiques** en chaîne.

Le contenu viral gratuit est le levier le plus puissant jamais créé pour les entrepreneurs indépendants.

---

## 👥 CHAPITRE 5 — COMMENT PRÉPARER UN COMPTE VIRAL

Le profil de tes réseaux sociaux est ta vitrine. Il doit projeter la confiance et l'autorité en un claquement de doigts.

### 📸 1. Une photo de profil épurée
L'idéal est un logo professionnel épuré, un avatar stylisé aux couleurs sombres et dorées, ou un portrait de haute qualité reflétant le dynamisme et le succès.

### ✍️ 2. Un nom de profil stratégique
Fais-le court, professionnel et easy à retenir. Évite absolument les suites de chiffres génériques comme \`user5739201\`. Priorise des noms forts comme \`mz_elite\`, \`libre_et_debranche\`, \`strategie_richesse\`.

### 🪝 3. Une Biographie agressive (La Bio)
Elle doit délivrer en 3 phrases maximum :
1. Ce que tu résous (Ta proposition de valeur)
2. La promesse de transformation
3. Un appel à l'action net pointant vers le lien en bio.

> 📝 **Exemple de Bio à copier-coller :**
> *"J’aide les jeunes ambitieux à bâtir des tunnels automatiques de revenus passifs. 🧠👇"*
> *"Active ton système de liberté ici :"*

---

## 📱 CHAPITRE 6 — LE PROTOCOLE DE VIRALITÉ TIKTOK

TikTok est un amplificateur de visibilité phénoménal car l'algorithme montre tes vidéos à des inconnus ciblés, même si ton compte a **0 abonné** !

### 📐 La structure géométrique d'une vidéo virale :

1. **L'Accroche (0 à 3 secondes) :** C'est le "Hook". Tu dois stopper le scroll de l'utilisateur avec un titre contrasté ou une question provoquante.
2. **Le Rythme (3 à 15 secondes) :** Maintenir l'attention avec des transitions rythmées et des phrases courtes.
3. **L'Appel à l'Action (15 à 20 secondes) :** Indiquer au spectateur exactement quoi faire.

### 💥 Exemples d'accroches (Hooks) qui forcent l'attention :

*   *« Personne n’ose dire la vérité sur cette méthode de revenus… »*
*   *« Voici l'explication logique de pourquoi 99% des gens restent fauchés… »*
*   *« Cette stratégie méconnue va secouer ton compte bancaire ce soir… »*
*   *« J’aurais tellement aimé que quelqu'un m'explique ça à mes 18 ans… »*
*   *« Ton téléphone est soit un passif qui te coûte, soit un actif qui t'enrichit… »*

---

## 🎬 CHAPITRE 7 — CRÉER DES VIDÉOS QUI FONT ACHETER

Faire des chiffres de vues est amusant. Faire des ventes est fascinant.

La vente moderne ne consiste pas à harceler les gens. Elle consiste à exposer un problème criant et à placer naturellement ton produit comme l'unique solution logique.

### 📋 La formule séquentielle d'une vidéo d'affiliation rentable :

✦ **Le Crochet (0-3s) :** Une image forte et un texte accrocheur qui interpellent.

✦ **La Douleur (3-12s) :** Rappeler le quotidien frustrant (le manque de temps, la sensation d'être bloqué, travailler pour le rêve d'un autre).

✦ **La Solution (12-20s) :** Introduire la ressource (le produit que tu as choisi sur la plateforme).

✦ **Le Résultat (20-25s) :** Décrire l'après (recevoir des notifications de commissions en temps réel, gagner en autonomie).

✦ **Le CTA (25-30s) :** Donner un ordre simple et immédiat : *« Clique sur le lien dans mon profil pour télécharger ton plan. »*

---

## 🎁 BONUS EXCLUSIF : 10 SCRIPTS VIDÉOS À COPIER-COLLER

Voici 10 scripts rédigés de manière chirurgicale. Tu peux les enregistrer avec une voix d'intelligence artificielle ou ta propre voix off, en les illustrant avec des vidéos d'arrière-plan de haute qualité (lifestyle, plans de bureaux minimalistes, paysages urbains de nuit, etc.).

---

### 🎤 Script 1 : L'angle de la Révélation de l'Attention
*   **Produit cible :** *L'Ebook "Instagram Cashflow"*
*   **Accroche :** "Arrête d’utiliser Instagram uniquement pour consommer le temps des autres."
*   **Corps :** "Pendant que tu passes des heures à scroller gratuitement, des membres de la communauté utilisent des comptes anonymes pour encaisser automatiquement entre 15 000 et 35 000 FCFA par semaine. Ils promeuvent des guides ciblés grâce à la structure de conversion de la MZ+."
*   **Appel à l'action :** "Si tu veux copier leur plan de route, clique sur le lien dans ma bio pour récupérer ton guide *Instagram Cashflow* dès ce soir !"

---

### 🎤 Script 2 : L'angle du Contraste "Esclave vs Bâtisseur"
*   **Produit cible :** *L'Ebook "Réveille le millionnaire en toi"*
*   **Accroche :** "Voici l'unique différence entre la dépendance et la liberté."
*   **Corps :** "Les gens ordinaires échangent sans cesse leur temps contre un salaire fixe insuffisant. Ils espèrent s'en sortir en travaillant plus dur dans un vieux modèle. Mais les grands entrepreneurs construisent des machines automatiques. Un excellent système d'affiliation travaille pour toi en continu."
*   **Appel à l'action :** "Pour réveiller le souverain qui dort en toi, récupère l'ebook *Réveille le millionnaire en toi* sur mon lien en bio !"

---

### 🎤 Script 3 : L'angle de la Révélation Anonyme (Sans visage)
*   **Produit cible :** *L'Ebook "Instagram Cashflow"*
*   **Accroche :** "Comment j'ai fait ma première vente en affiliation depuis mon lit."
*   **Corps :** "Sans boutique physique, sans service client et surtout sans jamais montrer mon visage sur les réseaux. J'ai simplement appliqué la formule d'attention magnétique de la MZ+ de manière épurée. Une seule petite vidéo a attiré des dizaines de prospects prêts à acheter."
*   **Appel à l'action :** "Ouvre la boutique de ma bio, prends ton guide *Instagram Cashflow* et commence à configurer ton système."

---

### 🎤 Script 4 : L'angle du Réseau d'Affaires
*   **Produit cible :** *La Puissance du Parrainage & Membre Premium MZ+*
*   **Accroche :** "Seul tu es limité, mais ensemble nous devenons invincibles."
*   **Corps :** "Pourquoi penses-tu que les grands patrons s'enrichissent si vite ? Parce qu'ils créent des alliances financières. Dans la communauté MZ+, chaque fois que tu partages ta clé, tu gagnes 2 500 FCFA cash tout en renforçant l'influence de ta tribu."
*   **Appel à l'action :** "Ne reste pas isolé. Rejoins notre équipe sur le lien de ma bio et bâtissons ensemble !"

---

### 🎤 Script 5 : L'angle de l'IA Révolutionnaire
*   **Produit cible :** *Ebook d'Affiliation "TikTok Sans Visage"*
*   **Accroche :** "L'Intelligence Artificielle est en train de redistribuer toutes les cartes."
*   **Corps :** "Tu penses encore qu'il te faut des compétences en codage pour créer une boutique ? Grave erreur. Aujourd'hui, avec CapCut, ChatGPT et les outils d'IA de la MZ+, n'importe quel jeune motivé peut assembler un tunnel automatisé performant en un week-end."
*   **Appel à l'action :** "Prends ta clé de démarrage sur le lien dans mon profil et devance la concurrence !"

---

### 🎤 Script 6 : L'angle de l'Évitement de l'Échec
*   **Produit cible :** *L'Ebook "Réveille le millionnaire en toi"*
*   **Accroche :** "Voici l'exacte raison pour laquelle 95% des débutants échouent."
*   **Corps :** "Ce n'est pas par manque d'intelligence. C'est simplement parce qu'ils agissent de manière désordonnée, au hasard. Ils essaient de réinventer la roue au lieu de simplement calquer un protocole éprouvé pas à pas."
*   **Appel à l'action :** "Ne perds pas des mois à tâtonner dans le vide. Économise ton temps et récupère *Réveille le millionnaire en toi* sur mon lien en bio."

---

### 🎤 Script 7 : L'angle du Coût de l'Inaction
*   **Produit cible :** *L'Ebook "Instagram Cashflow"*
*   **Accroche :** "Combien te coûte réellement ta peur d'essayer ?"
*   **Corps :** "Dans 6 mois, ton quotidien sera exactement le même si tu n'injectes pas de nouvelles compétences aujourd'hui. Pendant ce temps, d'autres ont investi l'équivalent d'un simple sandwich pour mettre la main sur la stratégie de commissions passives."
*   **Appel à l'action :** "Prends la décision de changer de camp. Clique sur le lien en bio et rejoins le mouvement."

---

### 🎤 Script 8 : L'angle du Résultat et de l'Énergie
*   **Produit cible :** *L'accès Premium MZ+*
*   **Accroche :** "Regarde ces captures d'écran de commissions réelles."
*   **Corps :** "Ce ne sont pas des gains sortis d'un chapeau magique. Ce sont les résultats tangibles de membres MZ+ Premium qui appliquent l'automatisation. Pas de formule magique, juste l'application méthodique d'un réseau automatique."
*   **Appel à l'action :** "Connect-toi à ton espace personnel, clique sur l'onglet d'activation et passe Premium maintenant !"

---

### 🎤 Script 9 : La Métamorphose de ton Smartphone
*   **Produit cible :** *L'Ebook "Instagram Cashflow"*
*   **Accroche :** "Ton smartphone est-il une dépense ou un investissement ?"
*   **Corps :** "Si tu t'en sers uniquement pour regarder des mèmes et consommer de manière passive, il te coûte du temps et de l'attention. S'il te sert à canaliser des commissions d'affiliation tous les jours, il devient ton actif le plus précieux."
*   **Appel à l'action :** "Choisis de posséder l'outil de production. Récupère le protocole sur mon lien en bio."

---

### 🎤 Script 10 : L'angle de la Souveraineté Financière
*   **Produit cible :** *L'Ebook "Réveille le millionnaire en toi"*
*   **Accroche :** "Un salaire te permet de vivre, mais un système te rend libre."
*   **Corps :** "Ne passe pas les 40 prochaines années de ta vie active à bâtir le projet de retraite de ton patron. Déploie ton propre tunnel d'affiliation, canalise le trafic gratuit et génère de vrais flux résiduels."
*   **Appel à l'action :** "Le guide complet t'attend derrière le lien de ma bio. Prends le contrôle de ton destin."

---

## 🎯 CHAPITRE 8 — COMMENT CONVERTIR LES VUES EN COMISSIONS

Obtenir un million de vues n'a d'utilité que si l'attention est convertie. L'attention sur internet est une denrée volatile : elle s'évapore en quelques secondes.

### 🧠 Les trois règles fondamentales de la persuasion :

✦ **La charge émotionnelle :** L'acheteur n'utilise la logique que *pour justifier un choix déjà guidé par l'émotion* (le désir de s'élever, l'ambition, la peur du regret).

✦ **La fluidité du parcours :** Moins l'utilisateur doit faire d'étapes de clic pour payer, plus le taux d'achat augmente de façon spectaculaire.

✦ **La effet d'urgence :** Explique pourquoi repousser l'action est l'ennemi numéro un de la réussite.

---

## 📅 CHAPITRE 9 — LE PROTOCOLE DE PUBLICATION CONSTANTE

Publier de temps à observe selon ton humeur est la garantie de rester invisible.

### 🛡️ La discipline surclasse le talent naturel

Les algorithmes des moteurs de recommandation adorent la prévisibilité. Publie au moins une vidéo originale par jour, à heures régulières, pour entraîner les robots et habituer tes spectateurs.

### 🔬 Expérimente et diversifie

Alterne entre ces 3 formats phares :
*   **L'Histoire (Storytelling) :** Toucher le cœur pour sensibiliser.
*   **Le Conseil direct (Éducatif) :** Offrir de la valeur rapide et utilisable.
*   **La Preuve (Sociale) :** Afficher des résultats et des tableaux de bord authentiques pour balayer le doute.

---

## ⚙️ CHAPITRE 10 — CRÉER UNE MACHINE DE GUERRE ORGANIQUE

Considère chaque vidéo que tu crées et publies comme un **actif numérique permanent**.

Une vidéo postée il y a 30 jours peut soudainement être mise en avant par l'algorithme et déclencher des dizaines de ventes en l'espace d'une nuit. C’est la force tranquille des effets cumulés sur internet.

---

## 🚫 CHAPITRE 11 — LES TROIS PIÈGES À ÉVITER

1.  **L'impatience juvénile :** S'arrêter au bout de 5 vidéos en disant *"ça ne marche pas"*, alors que l'algorithme est en phase de calibrage de ton audience.
2.  **La paralysie de la perfection :** Attendre d'avoir la plus belle caméra du marché ou le micro parfait. **Fais-le imparfaitement, mais fais-le dès aujourd'hui !**
3.  **L'imitation robotique :** Copier des concurrents sans chercher à comprendre la psychologie de l'attention cachée derrière leurs scripts.

---

## 🦁 CHAPITRE 12 — LE MINDSET DE L'ÉLITE MZ+

Les leaders absolus de la communauté adoptent des paradigmes radicalement opposés à ceux de la masse :

✦ Ils considèrent leur temps libre comme leur ressource la plus précieuse d'ici-bas.

✦ Ils perçoivent l'attention des masses connectées comme l'or noir du 21e siècle.

✦ Ils cherchent à empiler des structures automatiques durables, au lieu de chasser de micro-gains éphémères.

---

## 🧱 CHAPITRE 13 — POURQUOI LA MAJORITÉ RESTE SUR LE CARREAU

La majorité des débutants essaient d'assembler les pièces du puzzle tout seuls, isolés dans leur coin.

Ils consomment du contenu éparpillé et gratuit sur YouTube, se contredisent eux-mêmes, s'essoufflent face aux obstacles techniques et finissent par démissionner.

Il leur manque un **plan de vol étape par étape**, un **mentorat transparent** et une **communauté de leaders** pour les tirer vers le haut. Le temps perdu à stagner est le coût le plus cher du business.

---

## ⛔ CHAPITRE 14 — LES LIMITES DE LA ZONE GRATUITE

La zone gratuite est parfaite pour t'exercer, comprendre les bases et faire tes premières commissions de test. 

Mais pour bâtir un véritable empire automatisé et écurer des commissions de manière récurrente et massive, tu as besoin d'une puissante accélération.

C'est ici que l'écosystème **Premium** prend tout son sens.

---

## 👑 L'ACCÉLÉRATEUR SUPRÊME : MZ+ PREMIUM

Il existe deux types de personnes : celles qui regardent le train passer, et celles qui conduisent la locomotive.

La **Masterclass Premium** a été sculptée pour les bâtisseurs déterminés à dominer le marché et à automatiser leur indépendance financière.

### 🔓 En rejoignant l'élite Premium, tu débloques :

✦ **Un accompagnement stratégique quotidien** par nos meilleurs experts certifiés.

✦ **L'accès total et illimité à l'intégralité de nos masterclasses** avancées de vente.

✦ **Nos meilleurs tunnels de vente prêts-à-l'emploi** à dupliquer en 3 clics.

✦ **L'intégration immédiate au cercle privé VIP**, le cerveau collectif des entrepreneurs les plus actifs du réseau.

> **Ne te contente pas de participer. Décide de régner.**
> Active ton accès Premium et fais travailler le système pour toi ! 🦁👑💎

---

*Pour tout débloquer et basculer dans le top 1%, clique sur le bouton **ACTIVER MON ACCÈS MASTER PREMIUM** ci-dessous !*`
       });
    }

    const hasDefaultFreeVideo = finalData.some(f => f.id === 'default-free-video');
    const challengeState = profile?.store_preferences?.challenge_3j || {};
    
    // Check if the user is accessing the video via a direct link
    const urlParams = new URLSearchParams(window.location.search);
    const hasDirectLink = urlParams.get('formationId') === 'default-free-video' || 
                          urlParams.get('video') === 'default-free-video' || 
                          urlParams.get('vid') === 'default-free-video' ||
                          pendingFormationId === 'default-free-video';
    
    const canSeeDay2 = challengeState.j2Presented || isAdmin || hasDirectLink;

    if (!hasDefaultFreeVideo && canSeeDay2) {
      defaultInjections.push({
           id: 'default-free-video',
           title: 'La méthode en vidéo',
           description: 'Lancer son premier business avec les bonnes bases',
           thumbnail_url: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=2070&auto=format&fit=crop',
           preview_url: 'https://www.youtube.com/watch?v=TaKS_28uuWg',
           max_preview_seconds: 0,
           created_at: new Date().toISOString(),
           is_free: true,
           content_type: 'text',
           text_content: `Dans cette formation, tu vas comprendre une chose essentielle :\n\nVendre, ce n’est pas forcer…\nc’est faire comprendre.\n\nTu vas apprendre à transformer un produit en solution,\net donner envie d’acheter naturellement.\n\nMais si tu veux aller plus loin…\n\nPasse en MZ+ Premium.\nLà où tu ne regardes plus… tu gagnes.`
      });
    }

    finalData = [...defaultInjections, ...finalData];
    setFormations(finalData);
    setLoading(false);
  };

  useEffect(() => {
    fetchFormations();
    const channel = supabase.channel('formations_realtime_elite_v5')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_formations' }, fetchFormations)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const handleOpenFormation = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      const formationId = customEvent.detail.id;
      if (formations.length > 0) {
        const formation = formations.find(f => f.id === formationId);
        if (formation) {
          setActiveTextFormation(formation);
        }
      } else {
        setPendingFormationId(formationId);
      }
    };
    window.addEventListener('open-formation', handleOpenFormation);
    return () => {
      window.removeEventListener('open-formation', handleOpenFormation);
    };
  }, [formations]);

  useEffect(() => {
    if (formations.length > 0 && pendingFormationId) {
      const formation = formations.find(f => f.id === pendingFormationId);
      if (formation) {
        setActiveTextFormation(formation);
      }
      setPendingFormationId(null);
    }
  }, [formations, pendingFormationId]);

  const handleReadTextFormation = (formation: Formation) => {
     setActiveTextFormation(formation);
  };

  if (loading) return (
    <div className="py-40 flex flex-col items-center gap-8">
      <div className="relative">
        <div className="w-20 h-20 border-[1px] border-purple-500/20 rounded-full animate-ping absolute"></div>
        <Loader2 className="animate-spin text-purple-500" size={40} strokeWidth={1} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-neutral-600 animate-pulse">Initialisation de l'expertise...</p>
    </div>
  );

  const freeFormations = formations.filter(f => f.is_free);
  const premiumFormations = formations.filter(f => !f.is_free);

  return (
    <div className="animate-fade-in pb-40 px-4 md:px-0 max-w-5xl mx-auto">
      
      {/* 1. HEADER ÉPURÉ & STATUT UNIQUE */}
      <div className="text-center mb-16 space-y-8">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-500">Masterclass Élite</span>
           </div>
           <h2 className="text-4xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85]">
             ACADÉMIE <br/><PurpleText>STRATÉGIQUE</PurpleText>
           </h2>
           <div className="flex justify-center pt-2">
             <button 
               onClick={() => {
                 const refParam = profile?.referral_code ? `?ref=${profile.referral_code}` : '';
                 const directLink = `${window.location.protocol}//${window.location.host}/academie${refParam}`;
                 navigator.clipboard.writeText(directLink);
                 setCopied(true);
                 setTimeout(() => setCopied(false), 3000);
               }}
               className={`group p-2 flex items-center gap-2 border rounded-full pr-5 transition-all duration-300 ${
                 copied 
                   ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                   : 'bg-[#a855f7]/10 border-[#a855f7]/30 text-purple-300 hover:bg-[#a855f7]/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
               }`}
             >
               <div className={`p-1.5 rounded-full transition-colors duration-300 flex items-center justify-center ${
                 copied ? 'bg-emerald-600/30 text-emerald-400' : 'bg-[#a855f7]/20 text-purple-400'
               }`}>
                 {copied ? (
                   <span className="font-bold text-[10px] leading-none">✓</span>
                 ) : (
                   <ArrowUpRight size={12} />
                 )}
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest">
                 {copied ? 'Lien d\'Accès Copié !' : 'Copier Lien de l\'Académie'}
               </span>
             </button>
           </div>
        </div>
      </div>

      {/* TAB TOGGLE: GRATUIT / PREMIUM */}
      <div className="max-w-sm mx-auto mb-16 flex bg-[#111] p-1.5 rounded-full border border-white/10">
        <button 
          onClick={() => setActiveFilter('free')}
          className={`flex-1 py-3 px-6 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
            activeFilter === 'free' 
              ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
              : 'text-neutral-500 hover:text-white'
          }`}
        >
          Gratuit
        </button>
        <button 
          onClick={() => setActiveFilter('premium')}
          className={`flex-1 py-3 px-6 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
            activeFilter === 'premium' 
              ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]' 
              : 'text-neutral-500 hover:text-white'
          }`}
        >
          MZ+ Premium
        </button>
      </div>

      {/* BANDEAU DE STATUT PREMIUM - CTA GLOBAL */}
      {!isPremium && activeFilter === 'premium' && (
        <div className="mb-24 max-w-2xl mx-auto bg-gradient-to-r from-purple-900/40 via-purple-600/20 to-purple-900/40 border border-purple-500/30 p-6 rounded-[2rem] backdrop-blur-xl animate-slide-down flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
           <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                 <Rocket size={20} strokeWidth={2.5} />
              </div>
              <div>
                 <p className="text-white text-xs font-black uppercase tracking-tight">Évoluer vers la MZ+ Premium</p>
                 <p className="text-purple-300/60 text-[10px] font-medium leading-tight">Change de niveau pour accéder à toutes les formations en illimité et gratuitement.</p>
              </div>
           </div>
           <button 
             onClick={() => onSwitchTab('flash_offer')}
             className="px-6 py-3.5 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl whitespace-nowrap"
           >
             Voir l'offre
           </button>
        </div>
      )}

      {/* 2. LISTE DES MODULES - GRATUITS */}
      {activeFilter === 'free' && freeFormations.length > 0 && (
        <div className="mb-32 animate-fade-in">
          <div className="flex items-center gap-4 mb-16 border-b border-emerald-500/20 pb-4">
            <Unlock className="text-emerald-500" size={24} />
            <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">Formations <span className="text-emerald-500">Gratuites</span></h3>
          </div>
          <div className="space-y-48">
            {freeFormations.map((f, index) => (
              <EliteModuleCard 
                key={f.id} 
                formation={f} 
                index={index + 1}
                isPremium={isPremium} 
                isFree={true}
                onUpgrade={() => onSwitchTab('flash_offer')} 
                onReadClick={() => handleReadTextFormation(f)}
                profile={profile}
              />
            ))}
          </div>
          <div className="mt-16 text-center bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
            <p className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-widest">🎯 Évolue et accumule des points d'expérience pour débloquer de nouvelles formations gratuites.</p>
          </div>
        </div>
      )}

      {/* 3. LISTE DES MODULES - PREMIUM */}
      {activeFilter === 'premium' && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-16 border-b border-purple-500/20 pb-4">
            <Crown className="text-purple-500" size={24} />
            <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">Formations <PurpleText>Premium</PurpleText></h3>
          </div>
          <div className="space-y-48">
            {premiumFormations.length === 0 ? (
              <div className="py-20 text-center opacity-20 italic uppercase tracking-[0.5em] text-xs font-black">Aucun module premium disponible...</div>
            ) : (
              premiumFormations.map((f, index) => (
                <EliteModuleCard 
                  key={f.id} 
                  formation={f} 
                  index={freeFormations.length + index + 1}
                  isPremium={isPremium} 
                  isFree={false}
                  onUpgrade={() => onSwitchTab('flash_offer')} 
                  onReadClick={() => handleReadTextFormation(f)}
                  profile={profile}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* FOOTER RAFFINÉ */}
      <div className="mt-40 pt-20 border-t border-white/5 text-center opacity-20">
         <ShieldCheck size={32} className="mx-auto mb-4 text-purple-500" />
         <p className="text-[8px] font-black uppercase tracking-[0.5em]">Certification Millionaire Zone Plus • Tous droits réservés</p>
      </div>
      
      {activeTextFormation && (
        <TextFormationReader 
           title={activeTextFormation.title}
           content={activeTextFormation.text_content || ''}
           formationId={activeTextFormation.id}
           isAdmin={isAdmin}
           previewUrl={activeTextFormation.preview_url}
           onUpgrade={() => onSwitchTab('flash_offer')}
           profile={profile}
           onClose={() => {
             if (activeTextFormation.id === 'default-free-video') {
                window.dispatchEvent(new CustomEvent('mz-day2-formation-read'));
             }
             setActiveTextFormation(null);
           }}
           onComplete={() => {
             if (activeTextFormation.id === 'default-free-video') {
                window.dispatchEvent(new CustomEvent('mz-day2-formation-read'));
             }
             setActiveTextFormation(null);
           }}
        />
      )}
    </div>
  );
};

const EliteModuleCard: React.FC<{ formation: Formation; index: number; isPremium: boolean; isFree?: boolean; onUpgrade: () => void; onReadClick?: () => void; profile: UserProfile | null }> = ({ formation, index, isPremium, isFree = false, onUpgrade, onReadClick, profile }) => {
  const { axisState, hideAxis } = useAxis();
  const [showPaywall, setShowPaywall] = useState(false);
  const [copied, setCopied] = useState(false);

  const isHighlighted = formation.id === 'default-free-text' && axisState === 'progression';

  const getChapters = () => {
    if (formation.chapters && formation.chapters.length > 0) {
      const icons = [Target, Sparkles, TrendingUp, DollarSign, Rocket, Zap, ShieldCheck];
      return formation.chapters.map((ch, idx) => ({
        title: ch.title,
        icon: icons[idx % icons.length]
      }));
    }
    return [
      { title: "🎬 Chapitre 1 : Introduction & Concept", icon: Target },
      { title: "🚀 Chapitre 2 : Mise en place stratégique", icon: Sparkles },
      { title: "💰 Chapitre 3 : Optimisation des revenus", icon: DollarSign }
    ];
  };

  const chapters = getChapters();

  const handlePlay = () => {
    if (isHighlighted) hideAxis();
    if (showPaywall) return;
    
    if (!isPremium && !isFree) {
      setShowPaywall(true);
      return;
    }

    if (onReadClick) {
      onReadClick();
    }
  };

  const handleVideoEnded = () => {
    if (!isPremium && !isFree) {
      setShowPaywall(true);
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    }
  };

  const isTextBased = formation.content_type === 'text';

  return (
    <div className="space-y-12 animate-fade-in group">
      
      {/* 1. TITRE DU MODULE - Épuré */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
         <div className="space-y-2">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500/80">Module 0{index}</span>
               {index === 1 && !isFree && <span className="px-2 py-0.5 bg-yellow-600/10 border border-yellow-600/30 text-yellow-600 rounded-md text-[7px] font-black uppercase tracking-widest flex items-center gap-1"><Zap size={8}/> Fondamentaux</span>}
               {isTextBased && <span className="px-2 py-0.5 bg-blue-600/10 border border-blue-600/30 text-blue-500 rounded-md text-[7px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={8}/> Format Texte</span>}
            </div>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
              {formation.title}
            </h3>
         </div>
         <div className="flex flex-col items-start md:items-end gap-2 md:mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
              {isPremium || isFree ? "Accès Membre • Débloqué" : "Statut MZ+ • Privé"}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const refParam = profile?.referral_code ? `&ref=${profile.referral_code}` : '';
                  const shareLink = `${window.location.origin}/academie?formationId=${formation.id}${refParam}`;
                  navigator.clipboard.writeText(shareLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`p-1 px-2.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all focus:outline-none ${
                  copied
                    ? 'bg-emerald-600/25 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Copier le lien direct de cette leçon"
              >
                <span>{copied ? '✓ Copié !' : 'Copier Lien'}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const refParam = profile?.referral_code ? `&ref=${profile.referral_code}` : '';
                  const shareLink = `${window.location.origin}/academie?formationId=${formation.id}${refParam}`;
                  const refText = `🎥 Regarde la masterclass stratégique "${formation.title}" sur MZ+ gratuitement ! Apprends à automatiser tes revenus d'affiliation ici :`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${refText}\n\n${shareLink}`)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="p-1 px-2.5 rounded-full border border-green-500/20 bg-green-500/10 hover:bg-green-600/30 text-[9px] font-black uppercase tracking-widest text-green-400 hover:text-green-300 flex items-center gap-1.5 transition-all focus:outline-none"
                title="Partager sur WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shadow-sm">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.451 4.793 1.452 5.518 0 10.006-4.486 10.009-10.002.002-2.673-1.037-5.184-2.931-7.081C16.634 1.626 14.127.585 11.45.585 5.928.585 1.442 5.071 1.439 10.59c-.001 1.785.467 3.53 1.353 5.074l-1.012 3.693 3.795-.995zM18.23 15.65c-.299-.15-1.771-.873-2.046-.974-.275-.101-.476-.15-.676.15-.2.3-.776.974-.951 1.173-.175.2-.35.225-.65.075-.3-.15-1.263-.465-2.403-1.482-.888-.793-1.488-1.771-1.663-2.07-.175-.3-.019-.463.131-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.628-.926-2.228-.243-.585-.491-.507-.676-.516-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8 1.05-.275.975-1.05 3.074-1.05 3.174 0 .1.1.2.25.3.15.1.728 1.112 1.562 1.83 1.01 1.05 1.884 1.1 2.385 1.1l.6.05c1.4.1 2 .2 2.385.1l.6-.35c.34-.15.34-.65.25-.8l-.35-.2z" />
                </svg>
                Partager
              </button>
            </div>
         </div>
      </div>

      {/* 2. MINIATURE - Focus Image, pas de bouton externe */}
      <div className="relative max-w-5xl mx-auto">
        {isHighlighted && (
           <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-50">
             <span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-1 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-900/50 backdrop-blur-md">Clique ici</span>
             <ArrowDown className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" size={20} />
           </div>
        )}
        <div className={`relative aspect-video rounded-[3rem] overflow-hidden border bg-[#050505] shadow-[0_50px_100px_rgba(0,0,0,0.8)] transition-all duration-1000 group-hover:border-purple-600/20 ${isHighlighted ? 'border-emerald-500 ring-4 ring-[#10b981]/30 shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-pulse mz-highlighted-btn' : 'border-white/10'}`}>
          
          {!showPaywall && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer group/overlay" onClick={handlePlay}>
              <img 
                src={formation.thumbnail_url} 
                className="absolute inset-0 w-full h-full object-cover opacity-100 transition-all duration-1000 group-hover/overlay:scale-[1.03]" 
                alt={formation.title}
              />
              
              <div className="absolute inset-0 bg-black/10 group-hover/overlay:bg-black/30 transition-colors pointer-events-none"></div>
              
              {/* Badge d'exclusivité raffiné */}
              {!isPremium && !isFree && (
                <div className="absolute top-8 right-8 px-5 py-2 bg-black/60 backdrop-blur-xl border border-white/10 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest shadow-2xl z-20 flex items-center gap-2">
                   <Lock size={12} className="text-purple-500" /> RÉSERVÉ MZ+ PREMIUM
                </div>
              )}
              {isFree && !isPremium && (
                <div className="absolute top-8 right-8 px-5 py-2 bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 text-emerald-400 rounded-2xl text-[8px] font-black uppercase tracking-widest shadow-2xl z-20 flex items-center gap-2">
                   <Unlock size={12} /> ACCÈS LIBRE
                </div>
              )}

              {/* Bouton de lecture minimaliste */}
              <div className="relative z-10">
                 <div className="px-8 py-4 rounded-full border border-white/20 flex items-center justify-center gap-3 transition-all duration-500 shadow-2xl font-black tracking-widest uppercase text-xs text-white bg-black/40 backdrop-blur-md group-hover/overlay:bg-emerald-600 group-hover/overlay:border-emerald-400 group-hover/overlay:scale-105">
                    Voir <ArrowUpRight size={16} />
                 </div>
              </div>
            </div>
          )}

          {/* PAYWALL INTÉGRÉ - Uniquement si clic Standard */}
          {showPaywall && (
            <div className="absolute inset-0 z-20 bg-black/95 backdrop-blur-[100px] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-20 h-20 bg-purple-600/20 border border-purple-600/40 rounded-[2rem] flex items-center justify-center text-purple-400 mb-8 shadow-2xl animate-bounce">
                 <Lock size={36} strokeWidth={2.5} />
              </div>
              <div className="space-y-4 mb-10">
                 <h5 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter italic">
                   CONTENU <PurpleText>RÉSERVÉ</PurpleText>
                 </h5>
                 <p className="text-neutral-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">
                   Devenez membre MZ+ Premium pour débloquer l'intégralité de notre savoir stratégique.
                 </p>
              </div>
              <button 
                onClick={onUpgrade}
                className="group px-12 py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-2xl flex items-center gap-3 active:scale-95"
              >
                Débloquer tout le système <ArrowRight size={18} strokeWidth={3} />
              </button>
              <button onClick={() => setShowPaywall(false)} className="mt-8 text-neutral-600 text-[8px] font-black uppercase tracking-widest hover:text-white transition-colors">Plus tard</button>
            </div>
          )}
        </div>
      </div>

      {/* 3. PLAN D'ACTION (CHAPITRES) - Épuré et informatif */}
      {!isFree && (
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="flex items-center gap-3 pl-4 border-l-2 border-purple-600/30">
             <Eye size={12} className="text-purple-500" />
             <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] italic">
               Aperçu du programme stratégique
             </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
             {chapters.map((chap, i) => (
               <div key={i} className="flex items-center gap-6 p-5 bg-white/[0.01] border border-white/5 rounded-3xl hover:bg-white/[0.03] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-neutral-950 flex items-center justify-center text-neutral-700 transition-all shadow-inner shrink-0 group-hover:text-purple-400">
                     <chap.icon size={18} />
                  </div>
                  <h4 className="text-[10px] md:text-[12px] font-black uppercase text-neutral-500 tracking-widest leading-tight">
                     {chap.title}
                  </h4>
                  {(!isPremium && !isFree) && <Lock size={12} className="ml-auto text-neutral-800" />}
                  {(isPremium || isFree) && <CheckCircle2 size={16} className={`ml-auto ${isFree && !isPremium ? 'text-emerald-500/50' : 'text-purple-600/50'}`} />}
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};
