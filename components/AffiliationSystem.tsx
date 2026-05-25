import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShoppingBag as Bag,
  ShoppingBag, 
  Globe as Web, 
  Clock, 
  Target,
  History as Hist, 
  XCircle, 
  CheckCircle as Check, 
  Copy as CopyIcon, 
  Search,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  X,
  Crown,
  Sparkles,
  Edit3,
  Trash2,
  Zap,
  ArrowUpRight,
  Share2,
  BookOpen,
  RefreshCw,
  Coins,
  GraduationCap,
  Plus,
  Loader2,
  Calendar,
  MousePointer2 as Cursor,
  Activity,
  AlertCircle,
  Layers,
  Check as CheckIcon,
  X as XIcon,
  User,
  Image as ImageIcon,
  Save,
  ExternalLink,
  ArrowLeft,
  Shield,
  ArrowRight,
  ChevronDown,
  Bell,
  Megaphone,
  Home,
  Smartphone,
  Star,
  Facebook,
  Mail,
  MessageCircle,
  Link as LinkIcon,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../services/supabase.ts';
import { Product, Commission, UserProfile, ProductStat, TabId } from '../types.ts';
import { GoldBorderCard, PrimaryButton, SectionTitle, GoldText } from './UI.tsx';
import { ProductDetailView, getProductTrend, ShareModal } from './ProductDetailView.tsx';
import { CurrencyDisplay } from './ui/CurrencyDisplay.tsx';

interface AffiliationSystemProps {
  profile: UserProfile | null;
  isAdminView?: boolean;
  lastUpdateSignal?: number;
  showValidations?: boolean;
  showCatalog?: boolean;
  onSwitchTab?: (tab: TabId) => void;
  onlyCatalog?: boolean;
}

export const AffiliationSystem: React.FC<AffiliationSystemProps> = ({ 
  profile, 
  isAdminView = false, 
  lastUpdateSignal,
  showValidations = true,
  showCatalog = true,
  onSwitchTab,
  onlyCatalog = false
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isCatalogVisible, setIsCatalogVisible] = useState(onlyCatalog);
  const [activeCatalogFilter, setActiveCatalogFilter] = useState<'all' | 'popular' | 'sellers' | 'recommended'>('all');
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const productsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleDetail = (e: any) => setSelectedProductForDetail(e.detail);
    window.addEventListener('show_product_detail', handleDetail);
    return () => window.removeEventListener('show_product_detail', handleDetail);
  }, []);

  const scrollToProducts = () => {
    setIsCatalogVisible(true);
    // Use a small timeout to allow the DOM to update before scrolling
    setTimeout(() => {
      if (productsRef.current) {
        productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // États Admin Produit
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: 0,
    commission_amount: 0,
    image_url: '',
    final_link: '',
    chariow_product_id: ''
  });
  const [chariowProducts, setChariowProducts] = useState<any[]>([]);
  const [loadingChariowProducts, setLoadingChariowProducts] = useState(false);

  const fetchChariowProducts = async () => {
    setLoadingChariowProducts(true);
    try {
      const response = await fetch('/api/chariow/products');
      const json = await response.json();
      if (json && json.success) {
        let prodsList = [];
        const raw = json.data;
        if (Array.isArray(raw)) prodsList = raw;
        else if (raw?.data?.products && Array.isArray(raw.data.products)) prodsList = raw.data.products;
        else if (raw?.products && Array.isArray(raw.products)) prodsList = raw.products;
        else if (raw?.data && Array.isArray(raw.data)) prodsList = raw.data;
        setChariowProducts(prodsList);
      }
    } catch (e) {
      console.error("Error fetching Chariow products for dropdown mapping:", e);
    } finally {
      setLoadingChariowProducts(false);
    }
  };

  useEffect(() => {
    if (showProductForm && isAdminView) {
      fetchChariowProducts();
    }
  }, [showProductForm, isAdminView]);

  const fetchData = useCallback(async (retryCount = 0) => {
    try {
      setError(null);
      if (retryCount === 0) setLoading(true);

      const { data: prods, error: prodsError } = await supabase.from('products').select('*');
      
      if (prodsError) throw prodsError;
      
      setProducts(prods || []);

      if (isAdminView) {
        const { data: comms, error: commsError } = await supabase
          .from('commissions')
          .select(`*, products(*), users:user_id(full_name, email)`)
          .order('created_at', { ascending: false });
        if (commsError) throw commsError;
        setCommissions(comms || []);
      } else if (profile?.id) {
        const [commsRes, statsRes] = await Promise.all([
          supabase.from('commissions').select('*, products(*)').eq('user_id', profile.id).order('created_at', { ascending: false }),
          supabase.from('product_stats').select('product_id, clicks').eq('user_id', profile.id)
        ]);
        
        if (commsRes.error) throw commsRes.error;
        if (statsRes.error) throw statsRes.error;
        
        setCommissions(commsRes.data || []);
        setProductStats(statsRes.data || []);
      }
    } catch (e: any) { 
      console.error("Affiliation Fetch Error:", e);
      if (retryCount < 3 && (e.message?.includes('fetch') || e.name === 'TypeError')) {
        const delay = 1000 * (retryCount + 1);
        console.log(`Retrying affiliation fetch in ${delay}ms...`);
        setTimeout(() => fetchData(retryCount + 1), delay);
        return;
      }
      setError("Erreur de connexion. Veuillez vérifier votre réseau.");
      setProducts([]);
    } finally { 
      setLoading(false); 
    }
  }, [isAdminView, profile?.id]);

  useEffect(() => {
    fetchData();

    // Supabase Real-time Subscriptions for stats
    if (profile?.id) {
      const channel = supabase.channel('affiliation_stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'commissions' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_stats' }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); }
    }
  }, [fetchData, profile?.id, lastUpdateSignal]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('commissions').update({ status }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Erreur validation : " + e.message); } finally { setProcessingId(null); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(productFormData).eq('id', editingProduct.id);
        if (error) {
          if (error.message?.includes('chariow_product_id') || error.code === '42703') {
            throw new Error("La colonne 'chariow_product_id' n'existe pas dans la table 'products' de Supabase. Pour pouvoir l'utiliser, veuillez copier et exécuter le script SQL de migration (migration_chariow_association.sql) dans l'éditeur SQL de votre tableau de bord Supabase.");
          }
          throw error;
        }
      } else {
        const { error } = await supabase.from('products').insert([productFormData]);
        if (error) {
          if (error.message?.includes('chariow_product_id') || error.code === '42703') {
            throw new Error("La colonne 'chariow_product_id' n'existe pas dans la table 'products' de Supabase. Pour pouvoir l'utiliser, veuillez copier et exécuter le script SQL de migration (migration_chariow_association.sql) dans l'éditeur SQL de votre tableau de bord Supabase.");
          }
          throw error;
        }

        // Déclencher la notification broadcast pour le nouveau produit
        try {
          await fetch('/api/broadcast-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              productName: productFormData.name,
              icon: productFormData.image_url 
            })
          });
          console.log('FCM: Broadcast notification triggered for new product');
        } catch (pushErr) {
          console.warn('FCM: Failed to trigger broadcast notification:', pushErr);
        }
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setProductFormData({ name: '', description: '', price: 0, commission_amount: 0, image_url: '', final_link: '', chariow_product_id: '' });
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setIsSavingProduct(false); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ? Cela le retirera de la boutique de tout le monde et supprimera les statistiques associées.")) return;
    try {
      // 1. Clean up dependencies first
      await supabase.from('mz_user_store').delete().eq('product_id', id);
      await supabase.from('product_stats').delete().eq('product_id', id);
      await supabase.from('commissions').delete().eq('product_id', id);
      
      // 2. Delete the product
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert("Erreur: " + err.message); }
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      commission_amount: product.commission_amount || 0,
      image_url: product.image_url || '',
      final_link: product.final_link || '',
      chariow_product_id: product.chariow_product_id || ''
    });
    setShowProductForm(true);
  }  // --- RENDU ADMIN : GESTION DES VENTES ---
  if (isAdminView && showValidations) {
    const pending = commissions.filter(c => c.status === 'pending');
    const history = commissions.filter(c => c.status !== 'pending');
    
    const totalVolume = commissions.filter(c => c.status === 'approved').reduce((acc, c) => acc + c.amount, 0);

    return (
      <div className="space-y-10 animate-fade-in">
        {/* Résumé des Ventes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] space-y-2">
            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-widest">Volume Total</p>
            <CurrencyDisplay 
              amount={totalVolume} 
              className="text-xl font-black text-yellow-500 font-mono"
              secondaryClassName="text-[8px] text-neutral-600 font-bold ml-1 opacity-60"
            />
          </div>
          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] space-y-2">
            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-widest">Ventes Approuvées</p>
            <p className="text-xl font-black text-white font-mono">{commissions.filter(c => c.status === 'approved').length}</p>
          </div>
          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] space-y-2">
            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-widest">En attente</p>
            <p className="text-xl font-black text-orange-500 font-mono">{pending.length}</p>
          </div>
          <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] space-y-2">
            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-widest">Taux de Validation</p>
            <p className="text-xl font-black text-emerald-500 font-mono">
              {commissions.length > 0 ? Math.round((commissions.filter(c => c.status === 'approved').length / commissions.length) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Ventes en attente */}
        <div className="space-y-6">
          <h3 className="text-xl font-black uppercase text-orange-500 flex items-center gap-3 px-2"><AlertCircle size={20} /> Ventes à valider</h3>
          
          {/* Mobile View */}
          <div className="grid grid-cols-1 gap-4 md:hidden px-2">
            {pending.length === 0 ? (
              <div className="p-10 text-center opacity-30 text-[10px] uppercase border border-dashed border-white/10 rounded-2xl">Aucune vente en attente</div>
            ) : (
              pending.map(c => (
                <div key={c.id} className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black uppercase text-sm">{(c as any).users?.full_name || 'Inconnu'}</div>
                      <div className="text-[10px] font-bold text-neutral-300 mt-1">{c.products?.name}</div>
                    </div>
                    <div className="font-mono text-yellow-500 text-xs font-black">
                      <CurrencyDisplay 
                        amount={c.amount} 
                        className="font-mono text-yellow-500 text-xs font-black"
                        secondaryClassName="text-[8px] text-neutral-600 font-bold ml-1 opacity-60"
                      />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[8px] text-neutral-600 font-mono">{new Date(c.created_at).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <span className="text-[8px] font-black uppercase px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                        En attente (BDD)
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
             <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-[9px] font-black uppercase text-neutral-500 border-b border-neutral-800">
                  <tr>
                    <th className="p-6">Date</th>
                    <th className="p-6">Ambassadeur</th>
                    <th className="p-6">Produit</th>
                    <th className="p-6">Commission</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {pending.length === 0 ? (<tr><td colSpan={5} className="p-20 text-center opacity-30 text-[10px] uppercase">Aucune vente en attente</td></tr>) : 
                    pending.map(c => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-6 text-neutral-500 font-mono">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="p-6"><div className="font-black uppercase">{(c as any).users?.full_name || 'Inconnu'}</div></td>
                        <td className="p-6 font-bold text-neutral-300">{c.products?.name}</td>
                        <td className="p-6 font-mono text-yellow-500">
                          <CurrencyDisplay 
                            amount={c.amount} 
                            className="font-mono text-yellow-500"
                            secondaryClassName="text-[8px] text-neutral-600 font-bold ml-1 opacity-60"
                          />
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            <span className="text-[8px] font-black uppercase px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                              En attente (BDD)
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
             </table>
          </div>
        </div>

        {/* Historique des Ventes */}
        <div className="space-y-6">
          <h3 className="text-xl font-black uppercase text-neutral-500 flex items-center gap-3 px-2"><Hist size={20} /> Historique des ventes</h3>
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
             <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-[9px] font-black uppercase text-neutral-500 border-b border-neutral-800">
                  <tr>
                    <th className="p-6">Date</th>
                    <th className="p-6">Ambassadeur</th>
                    <th className="p-6">Produit</th>
                    <th className="p-6">Montant</th>
                    <th className="p-6 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {history.length === 0 ? (<tr><td colSpan={5} className="p-20 text-center opacity-30 text-[10px] uppercase">Aucun historique</td></tr>) : 
                    history.slice(0, 20).map(c => (
                      <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-6 text-neutral-600 font-mono">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="p-6">
                          <div className="font-bold uppercase text-neutral-400">{(c as any).users?.full_name || 'Inconnu'}</div>
                        </td>
                        <td className="p-6 text-neutral-500">{c.products?.name}</td>
                        <td className="p-6 font-mono text-neutral-400">
                          <CurrencyDisplay 
                            amount={c.amount} 
                            className="font-mono text-neutral-400"
                            secondaryClassName="text-[8px] text-neutral-600 font-bold ml-1 opacity-60"
                          />
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                              c.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {c.status === 'approved' ? 'Validé' : 'Refusé'}
                            </span>
                            {c.status === 'approved' && (
                              <button
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('mz-trigger-evolution-share', {
                                    detail: {
                                      type: 'sale_validated',
                                      data: {
                                        title: `Commission de ${c.amount.toLocaleString()} FCFA`,
                                        amount: c.amount
                                      }
                                    }
                                  }));
                                }}
                                title="Partager mon évolution"
                                className="p-1 px-2 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-500 transition-all flex items-center gap-1 text-[8px] font-black uppercase tracking-wider cursor-pointer"
                              >
                                <Share2 size={10} />
                                <span>Partager</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
             </table>
             {history.length > 20 && (
               <div className="p-4 text-center border-t border-white/5">
                 <p className="text-[8px] font-black uppercase text-neutral-600">Affichage des 20 dernières ventes</p>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDU ADMIN : GESTION DU CATALOGUE (CRUD) ---
  if (isAdminView && showCatalog) {
    return (
      <div className="space-y-8 animate-fade-in">
        {showProductForm && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowProductForm(false)}></div>
            <GoldBorderCard className="relative w-full max-w-xl bg-[#080808] border-white/10 p-6 md:p-8 shadow-2xl animate-slide-down">
               <div className="flex items-center justify-between mb-6 md:mb-8">
                  <h3 className="text-lg md:text-xl font-black uppercase">{editingProduct ? 'Modifier' : 'Créer'} <GoldText>Produit</GoldText></h3>
                  <button onClick={() => setShowProductForm(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24}/></button>
               </div>
               <form onSubmit={handleSaveProduct} className="space-y-4">
                  <input required className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white" placeholder="Nom du produit" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} />
                  <textarea required className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white h-24" placeholder="Description courte" value={productFormData.description} onChange={e => setProductFormData({...productFormData, description: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="number" className="bg-black border border-white/10 rounded-xl p-4 text-xs text-white" placeholder="Prix Public" value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: parseInt(e.target.value)})} />
                    <input required type="number" className="bg-black border border-white/10 rounded-xl p-4 text-xs text-white" placeholder="Com. Ambassadeur" value={productFormData.commission_amount} onChange={e => setProductFormData({...productFormData, commission_amount: parseInt(e.target.value)})} />
                  </div>
                  <input required className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white" placeholder="URL Image" value={productFormData.image_url} onChange={e => setProductFormData({...productFormData, image_url: e.target.value})} />
                  <input required className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white" placeholder="Lien de livraison final" value={productFormData.final_link} onChange={e => setProductFormData({...productFormData, final_link: e.target.value})} />
                  
                  <div className="space-y-1 my-2 text-left">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Associer à un produit Chariow (Optionnel)</label>
                    <select 
                      className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white uppercase font-bold tracking-wider"
                      value={productFormData.chariow_product_id || ''} 
                      onChange={e => setProductFormData({...productFormData, chariow_product_id: e.target.value})}
                    >
                      <option value="">-- Aucun produit Chariow (Paiement classique) --</option>
                      {loadingChariowProducts ? (
                        <option disabled>Chargement des produits Chariow...</option>
                      ) : (
                        chariowProducts.map((p: any) => {
                          const pId = p.id || p._id;
                          const pName = p.name || p.title || "Produit sans nom";
                          const pPrice = p.price || p.pricing?.price?.value || 0;
                          return (
                            <option key={pId} value={pId}>
                              {pName} ({pPrice} FCFA)
                            </option>
                          );
                        })
                      )}
                    </select>
                    <p className="text-[9px] text-neutral-500 italic">Si configuré, cela redirigera vers le parcours de paiement personnalisé Chariow après capture d'identité.</p>
                  </div>

                  <PrimaryButton type="submit" fullWidth isLoading={isSavingProduct}>Enregistrer le produit</PrimaryButton>
               </form>
            </GoldBorderCard>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
           <h3 className="text-xl font-black uppercase text-yellow-500 flex items-center gap-3"><Bag /> Gestion Catalogue</h3>
           <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 md:py-3 bg-yellow-600 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-yellow-500 shadow-xl transition-all"><Plus size={16}/> Ajouter un service</button>
        </div>

        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 md:hidden px-2">
          {products.length === 0 ? (
            <div className="p-10 text-center opacity-30 text-[10px] uppercase">Catalogue vide</div>
          ) : (
            products.map(p => (
              <div key={p.id} className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-white/5 overflow-hidden flex-shrink-0">
                    <img src={p.image_url} className="w-full h-full object-cover opacity-50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black uppercase text-white text-sm truncate">{p.name}</div>
                    <div className="flex gap-3 mt-1">
                      <CurrencyDisplay 
                        amount={p.price} 
                        className="text-[10px] font-mono text-neutral-400"
                        secondaryClassName="text-[8px] text-neutral-600 font-bold ml-1 opacity-60"
                      />
                      <CurrencyDisplay 
                        amount={p.commission_amount} 
                        className="text-[10px] font-mono text-yellow-500 font-bold"
                        secondaryClassName="text-[8px] text-neutral-600 font-bold ml-1 opacity-60"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/5 flex justify-end gap-3">
                  <button onClick={() => openEditProduct(p)} className="p-2.5 bg-white/5 text-blue-400 rounded-xl border border-white/10"><Edit3 size={16}/></button>
                  <button onClick={() => deleteProduct(p.id)} className="p-2.5 bg-white/5 text-red-500 rounded-xl border border-white/10"><Trash2 size={16}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
           <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-[9px] font-black uppercase text-neutral-500 border-b border-neutral-800">
                <tr><th className="p-8">Service / Produit</th><th className="p-8">Prix</th><th className="p-8">Com.</th><th className="p-8 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {products.length === 0 ? (<tr><td colSpan={4} className="p-20 text-center opacity-30 text-[10px] uppercase">Catalogue vide</td></tr>) : 
                  products.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="p-8"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/5 overflow-hidden"><img src={p.image_url} className="w-full h-full object-cover opacity-50" /></div><span className="font-black uppercase text-white">{p.name}</span></div></td>
                      <td className="p-8 font-mono text-neutral-400">
                        <CurrencyDisplay 
                          amount={p.price} 
                          className="font-mono text-neutral-400"
                          secondaryClassName="text-[8px] text-neutral-600 font-bold ml-1 opacity-60"
                        />
                      </td>
                      <td className="p-8 font-mono text-yellow-500 font-bold">
                        <CurrencyDisplay 
                          amount={p.commission_amount} 
                          className="font-mono text-yellow-500 font-bold"
                          secondaryClassName="text-[8px] text-neutral-600 font-bold ml-1 opacity-60"
                        />
                      </td>
                      <td className="p-8 text-right">
                         <div className="flex justify-end gap-3">
                            <button onClick={() => openEditProduct(p)} className="p-3 bg-white/5 text-blue-400 rounded-xl border border-white/10 hover:bg-blue-600/10"><Edit3 size={16}/></button>
                            <button onClick={() => deleteProduct(p.id)} className="p-3 bg-white/5 text-red-500 rounded-xl border border-white/10 hover:bg-red-600/10"><Trash2 size={16}/></button>
                         </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
           </table>
        </div>
      </div>
    );
  }

  // --- RENDU AMBASSADEUR : ESPACE CATALOGUE (STYLE MZ+ ELITE) ---
  // If a product is selected for detail view, show it
  if (selectedProductForDetail) {
    const productStatsData = {
      clicks: productStats.find(s => s.product_id === selectedProductForDetail.id)?.clicks || 0,
      conversions: commissions.filter(c => c.product_id === selectedProductForDetail.id).length
    };

    // Find the original index to match trend logic
    const productIndex = products.findIndex(p => p.id === selectedProductForDetail.id);

    return (
      <ProductDetailView 
          product={selectedProductForDetail} 
          stats={productStatsData}
          referralCode={profile?.referral_code || 'elite'}
          onBack={() => setSelectedProductForDetail(null)}
          index={productIndex >= 0 ? productIndex : 0}
      />
    );
  }

  if (onlyCatalog) {
    const filteredItems = products.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Coherent Sorting: Popularity simulation
    const getHotness = (p: Product) => {
      let hash = 0;
      for (let i = 0; i < p.id.length; i++) hash = p.id.charCodeAt(i) + ((hash << 5) - hash);
      return Math.abs(hash % 100);
    };

    const sortedItems = [...filteredItems].sort((a, b) => getHotness(b) - getHotness(a));

    const popularProducts = sortedItems.slice(0, 3);
    const topSellers = sortedItems.slice(3, 6);
    const recommended = sortedItems.slice(6);

    const productsToDisplay = activeCatalogFilter === 'all' 
      ? sortedItems 
      : activeCatalogFilter === 'popular' 
        ? popularProducts
        : activeCatalogFilter === 'sellers' 
          ? topSellers 
          : recommended;

    return (
      <div className="min-h-screen bg-[#080808] text-white font-sans pb-40">
        {/* Background Accents */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-500/5 blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Header Section */}
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 sticky top-0 z-50">
          <div className="flex items-center justify-between max-w-xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <Crown size={20} className="text-black" />
              </div>
              <h1 className="text-lg font-black italic tracking-tighter text-white">MZ+ <span className="text-yellow-500 uppercase">Market</span></h1>
            </div>
            <div className="relative group cursor-pointer">
              <Activity size={20} className="text-neutral-500 group-hover:text-yellow-500 transition-colors" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full border-2 border-black animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-5 py-8 space-y-10">
          {/* Search Bar - Elite Style */}
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-yellow-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Chercher un service..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] py-5 pl-16 pr-6 text-xs font-bold text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500/50 transition-all shadow-2xl"
            />
          </div>

          {/* Elite Filters - Compact & Wrapped (No more left scrolling) */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              onClick={() => setActiveCatalogFilter('all')}
              className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                activeCatalogFilter === 'all'
                  ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg scale-105' 
                  : 'bg-white/5 text-neutral-500 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>🌐</span> Tout
            </button>
            <button 
              onClick={() => setActiveCatalogFilter('recommended')}
              className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                activeCatalogFilter === 'recommended'
                  ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg scale-105' 
                  : 'bg-white/5 text-neutral-500 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>⭐</span> Favoris
            </button>
            <button 
              onClick={() => setActiveCatalogFilter('sellers')}
              className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                activeCatalogFilter === 'sellers' 
                  ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg scale-105' 
                  : 'bg-white/5 text-neutral-500 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>🔥</span> Ventes
            </button>
            <button 
              onClick={() => setActiveCatalogFilter('popular')}
              className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                activeCatalogFilter === 'popular' 
                  ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg scale-105' 
                  : 'bg-white/5 text-neutral-500 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>✨</span> Buzz
            </button>
          </div>

          {loading && products.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <Loader2 className="animate-spin text-yellow-500" size={40} />
                <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full"></div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-600 animate-pulse">Initialisation...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {productsToDisplay.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index}
                  clicks={productStats.find(s => s.product_id === product.id)?.clicks || 0} 
                  referralCode={profile?.referral_code} 
                />
              ))}
            </div>
          )}

          {/* Motivational Footer */}
          <div className="mt-20 p-10 rounded-[4rem] bg-gradient-to-br from-[#111] to-black border border-white/5 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30"></div>
             <Sparkles size={32} className="mx-auto text-yellow-500 mb-6 animate-pulse" />
             <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white mb-4">L'EXCELLENCE NE S'ATTEND PAS.</h2>
             <p className="text-neutral-500 font-bold uppercase tracking-widest text-[9px] max-w-xs mx-auto leading-loose opacity-60">Chaque partage est un pas de plus vers votre liberté financière. Agissez maintenant.</p>
          </div>
        </div>

        {/* Floating Elite Nav - MZ+ Style */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-black/60 backdrop-blur-3xl border border-white/10 px-8 py-5 flex items-center justify-between z-50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <button onClick={() => onSwitchTab?.('dashboard')} className="flex flex-col items-center gap-1.5 group transition-all active:scale-90">
            <Home size={20} className="text-neutral-600 group-hover:text-yellow-500 transition-colors" />
            <span className="text-[8px] font-black text-neutral-600 group-hover:text-white uppercase tracking-widest">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-12 bg-yellow-600 rounded-2xl flex items-center justify-center shadow-[0_15px_30px_rgba(202,138,4,0.4)] border border-yellow-500">
               <ShoppingBag size={24} className="text-black" />
            </div>
            <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest mt-6">Market</span>
          </button>
          <button onClick={() => onSwitchTab?.('profile')} className="flex flex-col items-center gap-1.5 group transition-all active:scale-90">
            <User size={20} className="text-neutral-600 group-hover:text-yellow-500 transition-colors" />
            <span className="text-[8px] font-black text-neutral-600 group-hover:text-white uppercase tracking-widest">Profil</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-20 animate-fade-in pb-32 px-4">
      
      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-center space-y-4">
          <p className="text-xs font-black uppercase text-red-500">{error}</p>
          <button 
            onClick={() => fetchData()}
            className="px-6 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-400 transition-all"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* 1. MES GAINS (Focus Central) */}
      <section className="text-center pt-12 space-y-6 overflow-hidden">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-yellow-600/5 border border-yellow-600/10 rounded-full">
          <div className="w-1 h-1 rounded-full bg-yellow-600 animate-pulse"></div>
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-neutral-500">Trésorerie Affiliation</span>
        </div>
        
        <div id="affiliation-balance-zone" className="space-y-4 py-4">
          <CurrencyDisplay 
            amount={commissions.filter(c => c.status === 'approved').reduce((acc, c) => acc + c.amount, 0)} 
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white font-mono tracking-tighter leading-tight break-words"
            secondaryClassName="text-lg md:text-xl text-yellow-600 font-black uppercase mt-2"
            vertical={true}
          />
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em]">Gains Encaissés</p>
        </div>
      </section>

      {/* 2. ANALYSE (Minimaliste & Discret) */}
      <section className="space-y-12">
        <div className="grid grid-cols-3 gap-8 py-10 border-y border-white/5 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <p className="text-2xl font-black text-white font-mono">{productStats.reduce((acc, s) => acc + (Number(s.clicks) || 0), 0)}</p>
            <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Clics</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-black text-white font-mono">{commissions.filter(c => c.status === 'approved').length}</p>
            <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Ventes</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-black text-white font-mono">
              {(productStats.reduce((acc, s) => acc + (Number(s.clicks) || 0), 0) > 0 
                ? (commissions.filter(c => c.status === 'approved').length / productStats.reduce((acc, s) => acc + (Number(s.clicks) || 0), 0) * 100).toFixed(1) 
                : "0")}%
            </p>
            <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Conv.</p>
          </div>
        </div>

        <div className="flex justify-center w-full px-2">
          <button 
            id="btn-see-products"
            onClick={(e) => {
              e.stopPropagation();
              if (onSwitchTab) onSwitchTab('catalog');
              else scrollToProducts();
            }}
            className="group relative w-full md:w-auto px-10 py-7 bg-white text-black rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.2em] shadow-[0_40px_80px_rgba(255,255,255,0.15)] hover:bg-yellow-500 hover:scale-[1.02] transition-all duration-500 flex items-center justify-center gap-4 active:scale-[0.95] overflow-hidden cursor-pointer"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
            
            <span className="relative z-10 pointer-events-none">Voir les produits à promouvoir</span>
            <ChevronDown size={20} className="relative z-10 group-hover:translate-y-2 transition-transform duration-500 pointer-events-none" />
          </button>
        </div>
      </section>

      {/* 3. VOIR LES PRODUITS (Catalogue Actionnable) */}
      {isCatalogVisible && (
        <section ref={productsRef} className="space-y-24 scroll-mt-20 min-h-[400px] animate-fade-in pt-10">
          <div className="flex items-center gap-6 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white whitespace-nowrap">Catalogue Élite</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>

          <div className="space-y-20">
            {products.length === 0 ? (
              <div className="py-20 text-center bg-white/5 border border-white/5 rounded-[2.5rem] space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Aucun produit disponible pour le moment</p>
                <button 
                  onClick={() => fetchData()}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Actualiser le catalogue
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product, index) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      index={index}
                      clicks={productStats.find(s => s.product_id === product.id)?.clicks || 0} 
                      referralCode={profile?.referral_code} 
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* 4. HISTORIQUE (Optionnel / Déroulant pour la clarté) */}
      {commissions.length > 0 && (
        <section className="pt-10 border-t border-white/5 max-w-2xl mx-auto">
          <details className="group">
            <summary className="list-none cursor-pointer flex items-center justify-between text-neutral-700 hover:text-neutral-400 transition-colors py-4">
              <span className="text-[9px] font-black uppercase tracking-[0.4em]">Historique des ventes</span>
              <ChevronDown size={14} className="group-open:rotate-180 transition-transform duration-500" />
            </summary>
            <div className="mt-8 space-y-3 animate-fade-in">
              {commissions.map(c => (
                <div key={c.id} className="p-5 bg-neutral-900/20 border border-white/5 rounded-3xl flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${c.status === 'approved' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">{c.products?.name || 'Service MZ+'}</p>
                      <p className="text-[7px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <CurrencyDisplay 
                    amount={c.amount} 
                    className="text-xs font-black text-yellow-500 font-mono"
                    secondaryClassName="text-[8px] text-neutral-600 font-bold opacity-60"
                    vertical={true}
                  />
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      <footer className="pt-20 opacity-10 text-center">
        <Shield size={24} className="mx-auto text-neutral-500" />
      </footer>
    </div>
  );
};




const ProductCard = ({ product, clicks, referralCode, index }: any) => {
  const isShareModalOpen = false;
  const setIsShareModalOpen = (val: boolean) => {};
  const link = `${window.location.origin}/?ref=${referralCode}&prod=${product.id}`;
  const trend = getProductTrend(product, index);

  const handleCopy = () => {
    setIsShareModalOpen(true);
    window.dispatchEvent(new CustomEvent('affiliation_link_copied', { detail: { productId: product.id } }));
  };

  return (
    <>
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        product={product} 
        link={link} 
      />
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ x: 5 }}
        onClick={() => window.dispatchEvent(new CustomEvent('show_product_detail', { detail: product }))}
        className="group relative bg-white/[0.03] border border-white/5 rounded-[1.5rem] p-4 cursor-pointer overflow-hidden transition-all hover:bg-white/[0.06] hover:border-yellow-500/30 flex items-center gap-4"
      >
        {/* Compact Image Section */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center p-2 relative">
            <motion.img 
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              src={product.image_url} 
              className="w-full h-full object-contain drop-shadow-xl" 
              alt="" 
            />
          </div>
          {trend.isPositive && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-black">
              <Zap size={8} fill="currentColor" />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-black text-white italic truncate uppercase tracking-tight group-hover:text-yellow-500 transition-colors">
              {product.name}
            </h4>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[7px] font-black text-yellow-500 font-mono tracking-tighter bg-yellow-500/10 px-1.5 py-0.5 rounded-sm">
                {clicks} CLICS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[6px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-0.5">Com.</span>
              <span className="text-base font-black text-emerald-400 font-mono italic leading-none">+{product.commission_amount.toLocaleString()}</span>
            </div>
            <div className="w-px h-5 bg-white/10"></div>
            <div className="flex flex-col opacity-50">
              <span className="text-[6px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-0.5">Prix</span>
              <span className="text-[10px] font-black text-white font-mono leading-none">{product.price.toLocaleString()}</span>
            </div>
          </div>

          {trend.isPositive && trend.dynamicMessage && (
            <p className="text-[8px] font-black text-neutral-400 uppercase italic truncate opacity-60">
              {trend.dynamicMessage}
            </p>
          )}
        </div>

        {/* Action Indicator */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="w-10 h-10 rounded-xl bg-yellow-500 text-black flex items-center justify-center shadow-lg active:scale-90 hover:bg-yellow-400 transition-all"
          >
            <Zap size={16} fill="currentColor" />
          </button>
        </div>
      </motion.div>
    </>
  );
};

