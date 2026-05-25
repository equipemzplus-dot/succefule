import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Shield, ShoppingBag, Loader2, AlertCircle, Sparkles, Check } from 'lucide-react';
import { Product } from '../types';
import { ChariowService } from '../services/ChariowService';
import { CurrencyDisplay } from './ui/CurrencyDisplay';
import { supabase } from '../services/supabase';

interface MZCheckoutProps {
  product: Product;
  referrerId?: string;
  onClose: () => void;
  onSuccess?: (saleId: string) => void;
}

const AFRICAN_EUROPEAN_COUNTRIES = [
  { code: 'CI', name: 'Côte d’Ivoire (+225)', dialCode: '+225' },
  { code: 'FR', name: 'France (+33)', dialCode: '+33' },
  { code: 'SN', name: 'Sénégal (+221)', dialCode: '+221' },
  { code: 'CM', name: 'Cameroun (+237)', dialCode: '+237' },
  { code: 'BJ', name: 'Bénin (+229)', dialCode: '+229' },
  { code: 'TG', name: 'Togo (+228)', dialCode: '+228' },
  { code: 'ML', name: 'Mali (+223)', dialCode: '+223' },
  { code: 'BF', name: 'Burkina Faso (+226)', dialCode: '+226' },
  { code: 'CG', name: 'Congo-Brazzaville (+242)', dialCode: '+242' },
  { code: 'CD', name: 'Congo-Kinshasa (+243)', dialCode: '+243' },
  { code: 'BE', name: 'Belgique (+32)', dialCode: '+32' },
  { code: 'CH', name: 'Suisse (+41)', dialCode: '+41' },
  { code: 'CA', name: 'Canada (+1)', dialCode: '+1' },
];

export const MZCheckout: React.FC<MZCheckoutProps> = ({
  product,
  referrerId,
  onClose,
  onSuccess
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('CI');
  const [loading, setLoading] = useState(false);
  const [errorObj, setErrorObj] = useState<{ message: string; details?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone) {
      setErrorObj({ message: 'Veuillez remplir tous les champs obligatoires du formulaire.' });
      return;
    }

    setLoading(true);
    setErrorObj(null);

    try {
      let finalReferrerId = referrerId;
      if (referrerId && !referrerId.includes('-')) {
        console.log('[MZCheckout] Resolving referrer referral code to user UUID:', referrerId);
        const { data: refUser } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referrerId)
          .maybeSingle();
        if (refUser) {
          finalReferrerId = refUser.id;
          console.log('[MZCheckout] Referrer resolved successfully:', finalReferrerId);
        } else {
          console.warn('[MZCheckout] Referrer code not found in DB:', referrerId);
        }
      }

      console.log('[MZCheckout] Initiating modern storefront integration payment...', {
        productId: product.id,
        referrerId: finalReferrerId
      });

      const res = await ChariowService.initiateCheckout({
        productId: product.id,
        email,
        firstName,
        lastName,
        phone,
        countryCode,
        referrerId: finalReferrerId
      });

      if (!res.success) {
        // Handle the specific error received from API (e.g. 404 Product not found)
        const errorMessage = res.data?.message || res.message || 'La transaction n’a pas pu être initiée.';
        const statusVal = (res as any).status || res.data?.status;
        const statusText = statusVal ? `HTTP ${statusVal}` : '';
        
        setErrorObj({
          message: `Réponse Chariow vide ou invalide : ${errorMessage}`,
          details: statusText ? `${statusText} - Veuillez vérifier que l'ID Produit est correct et qu'il est bien publié sur Chariow.` : undefined
        });
        setLoading(false);
        return;
      }

      // Check the step response
      const checkoutData = res.data?.data || res.data;
      if (checkoutData?.step === 'payment' && checkoutData?.payment?.checkout_url) {
        console.log('[MZCheckout] Redirecting internally and securely directly to Chariow Checkout URL');
        window.location.href = checkoutData.payment.checkout_url;
      } else {
        setErrorObj({
          message: 'L’API Chariow a retourné une structure de réponse inattendue.',
          details: JSON.stringify(checkoutData || res.data)
        });
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[MZCheckout] Error submitting payment:', err);
      setErrorObj({
        message: 'Impossible de joindre la passerelle de paiement MZ+/Chariow.',
        details: err.message || 'Erreur réseau.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden relative shadow-2xl"
      >
        {/* Banner header décoratif */}
        <div className="bg-gradient-to-r from-yellow-600/20 to-amber-500/20 px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Checkout Sécurisé MZ+</p>
              <h3 className="text-white font-extrabold text-sm uppercase truncate max-w-[250px]">{product.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulaire body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Section Produit & Recap */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-white/40 uppercase font-bold">Total à payer</span>
              <div className="font-mono text-xl font-black text-white">
                <CurrencyDisplay amount={product.price} />
              </div>
            </div>
            <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
              <Shield size={12} />
              MZ+ DIRECT
            </div>
          </div>

          {/* Affichage Message d'erreur personnalisé */}
          {errorObj && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-black uppercase tracking-wider">Erreur d'Initiation (404 / API)</p>
                <p className="font-medium text-red-300">{errorObj.message}</p>
                {errorObj.details && (
                  <p className="font-mono text-[10px] leading-tight text-red-400/80 mt-1.5 p-1.5 bg-black/40 rounded border border-white/5 whitespace-pre-wrap">
                    {errorObj.details}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-white/40 tracking-wider">Informations de facturation</h4>
            
            {/* Nom & Prenom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase">Prénom *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/20 text-xs font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase">Nom *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/20 text-xs font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/60 uppercase">E-mail *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@gmail.com"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/20 text-xs font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            {/* Téléphone & Pays */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase">Pays de résidence *</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={loading}
                  className="w-full bg-neutral-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
                >
                  {AFRICAN_EUROPEAN_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase">Numéro de Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/20 text-xs font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-white/40 flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
              <Check size={10} />
            </div>
            Paiement sécurisé par Chariow. Vos données restent confidentielles.
          </div>

          {/* Bouton de paiement */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_12px_24px_rgba(234,179,8,0.15)] hover:shadow-[0_12px_24px_rgba(234,179,8,0.25)]"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Initialisation de la transaction...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Procéder au paiement de {product.price}€
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
export default MZCheckout;
