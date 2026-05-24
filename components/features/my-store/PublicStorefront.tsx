import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Star, X, Search, ChevronRight, Check } from 'lucide-react';
import { CurrencyDisplay } from '../../ui/CurrencyDisplay';
import { Product } from '../../../types';

interface PublicStorefrontProps {
  products: Product[];
  onClose: () => void;
  storeName?: string;
  referralCode?: string;
  preferences?: any;
}

export function PublicStorefront({ products, onClose, storeName = "Ma Boutique Officielle", referralCode, preferences }: PublicStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCheckout = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedProduct) {
      window.dispatchEvent(new CustomEvent('mz-new-sale'));
      const link = referralCode ? `${window.location.origin}/?ref=${referralCode}&prod=${selectedProduct.id}` : selectedProduct.final_link;
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleBuyNow = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('mz-new-sale'));
    const link = referralCode ? `${window.location.origin}/?ref=${referralCode}&prod=${product.id}` : product.final_link;
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const theme = preferences?.theme || 'light';
  const primaryColor = preferences?.primary_color || '#6366f1';
  const isDark = theme === 'dark';

  const bgClass = isDark ? 'bg-[#0f0f12]' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const headerBgClass = isDark ? 'bg-[#12121a] border-b border-white/10' : 'bg-white shadow-sm';
  const cardBgClass = isDark ? 'bg-[#1a1a24] border-white/5' : 'bg-white border-gray-100';
  const textMutedClass = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`fixed inset-0 z-[100] ${bgClass} flex flex-col font-sans ${textClass} overflow-hidden`}>
      {/* Header */}
      <header className={`${headerBgClass} px-6 py-4 flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingBag size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{storeName}</h1>
        </div>
        <button 
          onClick={onClose}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
             isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <X size={20} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className={`py-16 px-6 relative`} style={{ backgroundColor: isDark ? '#12121a' : primaryColor + '10' }}>
          {/* Decorative background circle */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          ></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Découvrez notre sélection exclusive
            </h2>
            <p className={`text-lg ${textMutedClass} max-w-2xl mx-auto`}>
              Des produits de haute qualité choisis spécialement pour vous. Offres limitées à ne pas manquer.
            </p>
            
            <div className="mt-8 max-w-md mx-auto relative">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search size={20} className={isDark ? 'text-white/40' : 'text-gray-400'} />
               </div>
               <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className={`w-full pl-12 pr-4 py-4 rounded-full border shadow-sm focus:outline-none focus:ring-2 transition-all text-sm font-medium ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10' 
                      : 'bg-white border-gray-200 text-gray-900 focus:bg-white'
                  }`}
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
               />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          {products.length === 0 ? (
            <div className="text-center py-20">
               <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-400'}`}>
                  <ShoppingBag size={40} />
               </div>
               <h3 className={`text-xl font-bold mb-2`}>Aucun produit disponible</h3>
               <p className={textMutedClass}>Revenez plus tard pour découvrir nos offres.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={`text-center py-20 ${textMutedClass}`}>
               <p>Aucun produit ne correspond à votre recherche "{searchQuery}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border group flex flex-col relative ${cardBgClass}`}
                >
                  <div 
                    className="aspect-[4/3] bg-gray-100 relative overflow-hidden cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-green-600 shadow-md flex items-center gap-1.5">
                       <Star size={12} className="fill-green-600" />
                       Best Seller
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        <h3 className={`font-extrabold text-lg mb-2 line-clamp-2 leading-tight transition-colors`} style={{ color: textClass }}>
                        {product.name}
                        </h3>
                        <p className={`text-sm line-clamp-2 mb-6 ${textMutedClass}`}>
                        {product.description}
                        </p>
                    </div>
                    <div className="flex flex-col gap-4 mt-auto">
                        <div className="flex items-center justify-between">
                            <CurrencyDisplay amount={product.price} className={`text-2xl font-black ${textClass}`} />
                        </div>
                        <button 
                           onClick={(e) => handleBuyNow(product, e)}
                           className="w-full py-3.5 rounded-xl text-white font-black uppercase tracking-wide text-sm shadow-xl active:translate-y-0 transition-all flex items-center justify-center gap-2 relative overflow-hidden group hover:-translate-y-0.5"
                           style={{ backgroundColor: primaryColor }}
                        >
                           <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                           <ShoppingBag size={18} />
                           Acheter Maintenant
                        </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col md:flex-row max-h-[90vh] ${isDark ? 'bg-[#12121a]' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
               <div className={`md:w-1/2 relative ${isDark ? 'bg-[#0f0f12]' : 'bg-gray-100'}`}>
                  <button 
                     onClick={() => setSelectedProduct(null)}
                     className={`absolute top-4 left-4 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors md:hidden z-10 shadow-sm ${isDark ? 'bg-black/50 text-white/50 hover:bg-black hover:text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
                  >
                     <X size={20} />
                  </button>
                  <img 
                     src={selectedProduct.image_url} 
                     alt={selectedProduct.name}
                     className="w-full h-full object-cover min-h-[300px]"
                  />
               </div>
               <div className="md:w-1/2 p-8 sm:p-10 flex flex-col overflow-y-auto">
                  <div className="flex justify-between items-start mb-6 hidden md:flex">
                     <div 
                        className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full"
                        style={{ backgroundColor: primaryColor + '20', color: primaryColor }}
                     >
                        En Stock
                     </div>
                     <button 
                        onClick={() => setSelectedProduct(null)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                     >
                        <X size={20} />
                     </button>
                  </div>
                  
                  <h2 className={`text-3xl font-extrabold mb-4 leading-tight ${textClass}`}>{selectedProduct.name}</h2>
                  <CurrencyDisplay amount={selectedProduct.price} className="text-4xl font-black mb-6" style={{ color: primaryColor }} />
                  
                  <div className={`prose prose-sm xl:prose-base mb-8 whitespace-pre-wrap ${textMutedClass}`}>
                     {selectedProduct.description}
                  </div>

                  <div className="space-y-4 mb-8">
                     <div className={`flex items-center gap-3 text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                           <Check size={14} />
                        </div>
                        Paiement sécurisé
                     </div>
                     <div className={`flex items-center gap-3 text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                           <Check size={14} />
                        </div>
                        Accès immédiat
                     </div>
                     <div className={`flex items-center gap-3 text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                           <Check size={14} />
                        </div>
                        Support client 24/7
                     </div>
                  </div>

                  <div className={`mt-auto pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                     <button 
                        onClick={handleCheckout}
                        className="w-full py-5 rounded-2xl text-white font-black uppercase text-xl tracking-wide shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group hover:opacity-90 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                        style={{ backgroundColor: primaryColor }}
                     >
                        <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        <ShoppingBag size={24} />
                        Acheter Maintenant
                     </button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
