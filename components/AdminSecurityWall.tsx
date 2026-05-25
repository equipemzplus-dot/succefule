import React, { useState, useEffect } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, AlertTriangle, Crown, Terminal, LogOut
} from 'lucide-react';
import { supabase } from '../services/supabase.ts';
import { UserProfile } from '../types.ts';
import { AdminPanel } from './AdminPanel.tsx';

interface AdminSecurityWallProps {
  userProfile: UserProfile | null;
  onExit: () => void;
  onRefresh?: () => void;
}

export const AdminSecurityWall: React.FC<AdminSecurityWallProps> = ({ 
  userProfile, 
  onExit,
  onRefresh
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-focus email input on load
  useEffect(() => {
    const input = document.getElementById('admin-email');
    if (input) input.focus();
  }, []);

  const isAuthorizedAdmin = userProfile?.email === 'google@gmail.com';

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    
    // Strict front-end check to prevent any other email authorization attempt
    if (cleanEmail !== 'google@gmail.com') {
      setError("Accès refusé : Seul l'email administrateur officiel (google@gmail.com) est autorisé sur cette console.");
      return;
    }

    if (!password) {
      setError("Le mot de passe administrateur est requis.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error("Identifiants administratifs incorrects. Veuillez réessayer.");
        }
        throw signInError;
      }

      // Check if newly logged in session matches expected administrator
      if (data?.user?.email !== 'google@gmail.com') {
        await supabase.auth.signOut();
        throw new Error("Compte non autorisé. Déconnexion automatique.");
      }

      setSuccess(true);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Une erreur s'est produite lors de l'authentification.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectCurrentSession = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
    setError(null);
    setLoading(false);
    if (onRefresh) onRefresh();
  };

  // 1. Authorized View: Render full administrative dashboard
  if (isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-[#07080a] text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
        {/* Admin Header */}
        <header className="h-16 bg-[#0c0e12] border-b border-amber-500/30 px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
              <Crown size={16} />
            </span>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                SUPER CONSOLE ADMIN <span className="text-[9px] bg-red-600 text-white font-mono px-1.5 py-0.5 rounded ml-2">SÉCURISÉ</span>
              </h1>
              <p className="text-[10px] text-neutral-400 font-mono">Connecté en tant que: {userProfile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onExit}
              className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-300 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Voir Plateforme
            </button>
            <button 
              onClick={handleDisconnectCurrentSession}
              className="px-3.5 py-1.5 bg-red-950/20 border border-red-500/30 rounded-xl hover:bg-red-900/30 text-xs font-bold uppercase tracking-wider text-red-400 transition-all flex items-center gap-2"
              title="Se déconnecter"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </header>

        {/* Admin Content Area */}
        <div className="flex-1 bg-[#090b0e]">
          <AdminPanel adminProfile={userProfile} onRefresh={onRefresh} />
        </div>
      </div>
    );
  }

  // 2. Standard Session Present Warning View
  if (userProfile && userProfile.email !== 'google@gmail.com') {
    return (
      <div className="min-h-screen bg-[#070809] flex items-center justify-center p-6 relative select-none font-sans overflow-hidden">
        {/* Decorative Grid and Ambient Lights */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(191,155,48,0.03),transparent_70%)] pointer-events-none" />
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-amber-500/3 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-lg bg-[#0d0e12]/90 border border-red-500/20 rounded-[2.5rem] p-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 text-center space-y-8 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-bounce">
            <AlertTriangle size={36} />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black uppercase text-white tracking-tight">
              SESSION NON AUTORISÉE
            </h2>
            <p className="text-[#a3a3a3] text-sm leading-relaxed max-w-md mx-auto">
              Vous êtes actuellement connecté avec l'adresse <strong className="text-white font-mono">{userProfile.email}</strong>. 
              Cette console d'administration requiert impérativement de s'authentifier avec l'unique compte Administrateur désigné.
            </p>
          </div>

          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3.5 text-left text-xs text-red-400">
            <Lock className="shrink-0 mt-0.5" size={16} />
            <div>
              <span className="font-bold block uppercase tracking-wider mb-0.5">Restriction de Sécurité</span>
              Pour éviter les piratages et préserver la trésorerie de la plateforme, l'accès est scellé par double pare-feu.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onExit}
              className="flex-1 px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl hover:bg-neutral-800 font-bold uppercase text-xs tracking-wider text-[#d4d4d4] transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Retourner au site
            </button>
            <button
              onClick={handleDisconnectCurrentSession}
              disabled={loading}
              className="flex-1 px-5 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-2xl font-bold uppercase text-xs tracking-wider text-white shadow-lg hover:shadow-red-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogOut size={16} />
              )}
              Se Déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Admin Dynamic Sign-In Interface
  return (
    <div className="min-h-screen bg-[#070809] flex items-center justify-center p-6 relative select-none font-sans overflow-hidden">
      {/* Decorative Grid and Ambient Lights */}
      <div className="absolute inset-0 bg-[#0d0f12] bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.04),transparent_60%)] pointer-events-none" />
      <div className="absolute top-[-25%] left-[-25%] w-[70%] h-[70%] bg-amber-500/3 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-25%] w-[70%] h-[70%] bg-amber-500/3 blur-[150px] rounded-full pointer-events-none animate-pulse-slow" />

      <div className="w-full max-w-md bg-[#0d0e12]/90 border border-amber-500/20 rounded-[2.5rem] p-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 space-y-8 animate-fade-in">
        {/* Hexagonal Shield Logo with lock */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/5 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_30px_rgba(201,168,76,0.15)] relative group">
            <div className="absolute inset-0 bg-amber-500/5 rounded-3xl animate-ping border border-amber-500/30 opacity-70 pointer-events-none" />
            <Lock size={32} className="relative z-10 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-1.5 justify-center">
              CONSOLES ADMIN <Terminal size={16} className="text-amber-500" />
            </h2>
            <p className="text-[#a3a3a3] text-xs font-medium tracking-wide">
              Identification requise pour le Super Administrateur.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-xs animate-shake">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-400 text-xs animate-pulse">
            <ShieldCheck className="shrink-0 mt-0.5 text-emerald-400" size={16} />
            <span className="font-black leading-relaxed block uppercase tracking-wider">🔒 ACCÈS AUTORISÉ. Chargement du terminal...</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="admin-email" className="block text-[10px] font-black uppercase tracking-widest text-[#a3a3a3]">
              Email Administratif
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                <Mail size={18} />
              </span>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="google@gmail.com"
                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder-neutral-600 focus:border-amber-500/50 focus:bg-black/60 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono outline-none"
                required
                disabled={loading || success}
              />
            </div>
            {email.trim() && email.trim().toLowerCase() !== 'google@gmail.com' && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                ⚠️ Seul l'email google@gmail.com est accepté.
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="admin-pwd" className="block text-[10px] font-black uppercase tracking-widest text-[#a3a3a3]">
              Code d'accès secret
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                <Lock size={18} />
              </span>
              <input
                id="admin-pwd"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••••••"
                className="w-full pl-12 pr-12 py-4 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder-neutral-600 focus:border-amber-500/50 focus:bg-black/60 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono outline-none"
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 space-y-3">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-[0_4px_20px_rgba(201,168,76,0.15)] flex items-center justify-center gap-2.5 outline-none hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-black" />
              ) : (
                <Crown size={16} />
              )}
              {loading ? 'DURCISSEMENT SÉCURITÉ...' : 'AUTHENTIFIER ADMIN'}
            </button>

            <button
              type="button"
              onClick={onExit}
              className="w-full py-4 bg-neutral-950 hover:bg-neutral-900 border border-white/5 rounded-2xl text-[#a3a3a3] hover:text-white font-bold uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-2 outline-none"
            >
              <ArrowLeft size={14} /> Retourner au site public
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
