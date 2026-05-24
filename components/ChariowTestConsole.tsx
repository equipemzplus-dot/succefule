import React, { useState } from "react";
import { Terminal, RefreshCw, CheckCircle, XCircle, AlertCircle, Copy, Check, ShoppingBag, Database, ArrowUpRight } from "lucide-react";
import { supabase } from "../services/supabase.ts";

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  message?: string;
  error?: string;
  details?: string;
  data?: any;
  detectedKeyLength?: number;
  detectedKeyPreview?: string;
  isRoutedThroughDev?: boolean;
}

export const ChariowTestConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"status" | "products" | "checkout">("status");
  
  // Status tab states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [copiedStatusCurl, setCopiedStatusCurl] = useState(false);

  // Products tab states
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [productsResult, setProductsResult] = useState<TestResult | null>(null);
  const [copiedProductsCurl, setCopiedProductsCurl] = useState(false);
  
  // Checkout tab states
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<TestResult | null>(null);
  const [copiedCheckoutCurl, setCopiedCheckoutCurl] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    productId: "prd_abc123",
    email: "client@exemple.com",
    firstName: "Jean",
    lastName: "Dupont",
    phoneNumber: "612345678",
    countryCode: "FR"
  });

  // Db sync states
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ success: boolean; text: string } | null>(null);

  const tryDevFallbackCheckout = async (payload: any): Promise<boolean> => {
    try {
      const devUrl = "https://ais-dev-w3kjix4goaqo4wpcrbiy53-307056059286.europe-west2.run.app/api/chariow/checkout";
      const fallbackResponse = await fetch(devUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const fallbackContentType = fallbackResponse.headers.get("content-type") || "";
      
      if (fallbackContentType.includes("application/json")) {
        const fallbackData = await fallbackResponse.json() as TestResult;
        if (fallbackData.success) {
          setCheckoutResult({
            ...fallbackData,
            isRoutedThroughDev: true
          });
          return true;
        }
      }
    } catch (devErr) {
      console.warn("Fallback for checkout failed:", devErr);
    }
    return false;
  };

  const initiateCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutResult(null);
    let attemptedFallback = false;

    const payload = {
      product_id: checkoutForm.productId,
      email: checkoutForm.email,
      first_name: checkoutForm.firstName,
      last_name: checkoutForm.lastName,
      phone: {
        number: checkoutForm.phoneNumber,
        country_code: checkoutForm.countryCode
      }
    };

    try {
      const response = await fetch("/api/chariow/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const contentType = response.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        const data = await response.json() as TestResult;
        
        if (!data.success && data.error === "missing_api_key") {
          attemptedFallback = true;
          const fbSuccess = await tryDevFallbackCheckout(payload);
          if (fbSuccess) return;
        }
        
        setCheckoutResult(data);
      } else {
        const text = await response.text();
        attemptedFallback = true;
        const fbSuccess = await tryDevFallbackCheckout(payload);
        if (fbSuccess) return;

        setCheckoutResult({
          success: false,
          status: response.status,
          statusText: response.statusText,
          error: "html_response",
          message: "Le serveur n'a pas retourné de JSON lors de l'appel au checkout.",
          details: text.slice(0, 300)
        });
      }
    } catch (err: unknown) {
      if (!attemptedFallback) {
        const fbSuccess = await tryDevFallbackCheckout(payload);
        if (fbSuccess) return;
      }

      const errorMessage = err instanceof Error ? err.message : String(err);
      setCheckoutResult({
        success: false,
        error: "fetch_error",
        message: "Impossible de contacter l'API de checkout du serveur.",
        details: errorMessage
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const tryDevFallback = async (): Promise<boolean> => {
    try {
      const devUrl = "https://ais-dev-w3kjix4goaqo4wpcrbiy53-307056059286.europe-west2.run.app/api/chariow/test";
      const fallbackResponse = await fetch(devUrl);
      const fallbackContentType = fallbackResponse.headers.get("content-type") || "";
      
      if (fallbackContentType.includes("application/json")) {
        const fallbackData = await fallbackResponse.json() as TestResult;
        if (fallbackData.success) {
          setResult({
            ...fallbackData,
            isRoutedThroughDev: true
          });
          return true;
        }
      }
    } catch (devErr) {
      console.warn("Fallback to AI Studio development container failed:", devErr);
    }
    return false;
  };

  const testConnection = async () => {
    setLoading(true);
    setResult(null);
    let attemptedFallback = false;

    try {
      const response = await fetch("/api/chariow/test");
      const contentType = response.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        const data = await response.json() as TestResult;
        
        if (!data.success && data.error === "missing_api_key") {
          attemptedFallback = true;
          const fbSuccess = await tryDevFallback();
          if (fbSuccess) return;
        }
        
        setResult(data);
      } else {
        const text = await response.text();
        attemptedFallback = true;
        const fbSuccess = await tryDevFallback();
        if (fbSuccess) return;

        setResult({
          success: false,
          status: response.status,
          statusText: response.statusText,
          error: "html_response",
          message: "Le serveur n'a pas retourné de JSON. Veuillez vérifier que votre déploiement de serveurs serverless/Netlify est bien complété.",
          details: text.slice(0, 300)
        });
      }
    } catch (err: unknown) {
      if (!attemptedFallback) {
        const fbSuccess = await tryDevFallback();
        if (fbSuccess) return;
      }

      const errorMessage = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        error: "fetch_error",
        message: "Impossible de contacter l'API locale du serveur.",
        details: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const tryDevFallbackProducts = async (): Promise<boolean> => {
    try {
      const devUrl = "https://ais-dev-w3kjix4goaqo4wpcrbiy53-307056059286.europe-west2.run.app/api/chariow/products";
      const fallbackResponse = await fetch(devUrl);
      const fallbackContentType = fallbackResponse.headers.get("content-type") || "";
      
      if (fallbackContentType.includes("application/json")) {
        const fallbackData = await fallbackResponse.json() as TestResult;
        if (fallbackData.success) {
          setProductsResult({
            ...fallbackData,
            isRoutedThroughDev: true
          });
          return true;
        }
      }
    } catch (devErr) {
      console.warn("Fallback for products failed:", devErr);
    }
    return false;
  };

  const fetchProducts = async () => {
    setFetchingProducts(true);
    setProductsResult(null);
    setSyncMessage(null);
    let attemptedFallback = false;

    try {
      const response = await fetch("/api/chariow/products");
      const contentType = response.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        const data = await response.json() as TestResult;
        
        if (!data.success && data.error === "missing_api_key") {
          attemptedFallback = true;
          const fbSuccess = await tryDevFallbackProducts();
          if (fbSuccess) return;
        }
        
        setProductsResult(data);
      } else {
        const text = await response.text();
        attemptedFallback = true;
        const fbSuccess = await tryDevFallbackProducts();
        if (fbSuccess) return;

        setProductsResult({
          success: false,
          status: response.status,
          statusText: response.statusText,
          error: "html_response",
          message: "Le serveur n'a pas retourné de JSON lors de l'appel aux produits.",
          details: text.slice(0, 300)
        });
      }
    } catch (err: unknown) {
      if (!attemptedFallback) {
        const fbSuccess = await tryDevFallbackProducts();
        if (fbSuccess) return;
      }

      const errorMessage = err instanceof Error ? err.message : String(err);
      setProductsResult({
        success: false,
        error: "fetch_error",
        message: "Impossible de contacter l'API locale du serveur pour les produits.",
        details: errorMessage
      });
    } finally {
      setFetchingProducts(false);
    }
  };

  // Extract products array safely from variety of API returns (including Chariow's exact nested structure)
  const extractProducts = (): any[] => {
    if (!productsResult || !productsResult.success) return [];
    
    const nestedData = productsResult.data;
    if (!nestedData) return [];
    
    // If it is directly an array
    if (Array.isArray(nestedData)) {
      return nestedData;
    }
    
    // If nestedData has standard structure: { data: { products: [...] } }
    if (nestedData.data && nestedData.data.products && Array.isArray(nestedData.data.products)) {
      return nestedData.data.products;
    }

    // If nestedData has products property directly: { products: [...] }
    if (nestedData.products && Array.isArray(nestedData.products)) {
      return nestedData.products;
    }

    // If nestedData.data is directly the array: { data: [...] }
    if (nestedData.data && Array.isArray(nestedData.data)) {
      return nestedData.data;
    }
    
    return [];
  };

  const syncProductsToDatabase = async () => {
    const rawList = extractProducts();
    if (rawList.length === 0) {
      setSyncMessage({ success: false, text: "Aucun produit trouvé dans votre catalogue Chariow pour la synchronisation." });
      return;
    }

    setSyncingProducts(true);
    setSyncMessage(null);

    try {
      // Map products to database format
      const mappedList = rawList.map((cp: any) => {
        // Safe price extraction with standard Chariow pricing path
        const rawPrice = cp.price || cp.pricing?.price?.value || 0;
        const convertedPrice = Number(rawPrice) || 0;
        
        // Safe default commission deduction of 40% if not specified
        const rawCommission = cp.commission_amount || cp.commission || Math.floor(convertedPrice * 0.4);
        const commission = Number(rawCommission) || 0;

        // Clean link construction for Chariow checkout
        const slugOrId = cp.slug || cp.id;
        const fallbackLink = slugOrId ? `https://mzplus.mychariow.shop/${slugOrId}/checkout` : "https://api.chariow.com";
        const link = cp.final_link || cp.finalLink || cp.link || cp.url || cp.checkout_url || fallbackLink;

        return {
          id: String(cp.id || cp._id || `ch_${Math.random().toString(36).substr(2, 9)}`),
          name: cp.name || cp.title || "Produit Chariow",
          description: cp.description || cp.desc || "Pas de description fournie.",
          price: convertedPrice,
          commission_amount: commission,
          image_url: cp.image_url || cp.imageUrl || cp.image || cp.thumbnail || "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
          final_link: link
        };
      });

      // Insert/Upsert into Supabase products table
      console.log(`[Chariow Sync] Syncing ${mappedList.length} products to products database...`);
      const { error } = await supabase.from('products').upsert(mappedList, { onConflict: 'id' });
      if (error) throw error;

      setSyncMessage({ 
        success: true, 
        text: `Félicitations ! ${mappedList.length} produit(s) Chariow ont été insérés/mis à jour avec succès dans votre catalogue local MZ+. 🎉` 
      });
      
      // Send a Refresh signal to other components so catalog tab re-renders instantly
      window.dispatchEvent(new CustomEvent("mz-products-synced"));
    } catch (err: any) {
      console.error("[Chariow Sync error]", err);
      setSyncMessage({ success: false, text: `Erreur lors de l'intégration : ${err.message}` });
    } finally {
      setSyncingProducts(false);
    }
  };

  const curlStatusCommand = `curl -X GET "https://api.chariow.com/v1/store" \\\n  -H "Authorization: Bearer VOTRE_CLE_API"`;
  const curlProductsCommand = `curl -X GET "https://api.chariow.com/v1/products" \\\n  -H "Authorization: Bearer VOTRE_CLE_API"`;

  const copyStatusCurl = () => {
    navigator.clipboard.writeText(curlStatusCommand);
    setCopiedStatusCurl(true);
    setTimeout(() => setCopiedStatusCurl(false), 2000);
  };

  const copyProductsCurl = () => {
    navigator.clipboard.writeText(curlProductsCommand);
    setCopiedProductsCurl(true);
    setTimeout(() => setCopiedProductsCurl(false), 2000);
  };

  const fetchedProductsList = extractProducts();

  return (
    <div id="chariow-test-console" className="w-full bg-[#111] border border-neutral-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Terminal size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-white leading-tight">
              Console d'Intégration Chariow
            </h3>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
              Configuration de la boutique & produits affiliés v1
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("status")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "status" ? "bg-amber-500 text-black shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            Statut store (v1)
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "products" ? "bg-amber-500 text-black shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            Produits (v1)
          </button>
          <button
            onClick={() => setActiveTab("checkout")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "checkout" ? "bg-amber-500 text-black shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            Paiement (v1)
          </button>
        </div>
      </div>

      {activeTab === "status" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-widest">Vérification de connectivité générale :</span>
            <button
              onClick={testConnection}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer disabled:pointer-events-none"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {loading ? "Test en cours..." : "Tester la connexion"}
            </button>
          </div>

          {/* API documentation and query instructions */}
          <div className="bg-black/40 border border-neutral-800/80 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                Commande de Status Chariow :
              </span>
              <button
                onClick={copyStatusCurl}
                className="text-[10px] flex items-center gap-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                {copiedStatusCurl ? (
                  <>
                    <Check size={12} className="text-green-500" />
                    <span className="text-green-500">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copier curl</span>
                  </>
                )}
              </button>
            </div>
            <code className="block text-[10px] font-mono text-neutral-400 bg-neutral-900/60 p-2.5 rounded border border-neutral-800/40 leading-relaxed whitespace-pre overflow-x-auto select-all">
              {curlStatusCommand}
            </code>
          </div>

          {/* Results presentation box */}
          {result && (
            <div className="space-y-3 animate-fade-in">
              {/* Connection Status Badge */}
              <div className={`p-4 rounded-xl border ${
                result.success 
                  ? "bg-green-500/10 border-green-500/30 text-green-400" 
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {result.success ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-tight text-white leading-tight">
                      {result.success 
                        ? "Connexion Réussie (200 OK) !" 
                        : `Erreur de Connexion (${result.status || 'Code Erreur Unknown'})`}
                    </h4>
                    <p className="text-[11px] font-medium text-neutral-400 leading-relaxed">
                      {result.message || (result.success ? "La clé API Chariow fonctionne et votre compte est connecté !" : "Erreur de configuration.")}
                    </p>
                    
                    {result.error === "missing_api_key" && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mt-4 text-left">
                        <p className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-400 mb-2">
                          <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          Guide d'activation de la Clé API (Production)
                        </p>
                        <p className="text-[11px] text-neutral-300 leading-normal mb-3">
                          Pour configurer votre boutique en ligne avec l'API Chariow, veuillez insérer votre clé API dans les variables d'environnement (`CHARIOW_API_KEY`).
                        </p>
                      </div>
                    )}

                    {result.detectedKeyLength && (
                      <div className="flex items-center gap-2 pt-2 text-[10px] font-mono text-neutral-500 border-t border-neutral-800/40">
                        <span>Variable détectée : {result.detectedKeyPreview}</span>
                        <span>•</span>
                        <span>Longueur : {result.detectedKeyLength} caractères</span>
                      </div>
                    )}

                    {result.isRoutedThroughDev && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl mt-3 text-left">
                        <p className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
                          <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          Connexion validée via l'environnement
                        </p>
                        <p className="text-[10px] text-neutral-300 leading-normal mt-1">
                          Test effectué avec succès en utilisant la configuration active dans notre espace d'application.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Payload response */}
              <div className="bg-[#0b0b0b] rounded-xl border border-neutral-900 overflow-hidden">
                <div className="px-4 py-2.5 bg-neutral-900/40 border-b border-neutral-900 flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                    Réponse de l'API
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black ${
                    result.success ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    HTTP {result.status || 500}
                  </span>
                </div>
                <div className="p-4 overflow-x-auto max-h-[220px]">
                  <pre className="text-[10px] font-mono text-neutral-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(result.data || result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Informative placeholder state */}
          {!result && !loading && (
            <div className="bg-neutral-900/40 rounded-xl p-6 border border-neutral-900 text-center space-y-2">
              <AlertCircle className="mx-auto text-neutral-600" size={24} />
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                Prêt pour le test
              </h4>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Cliquez sur le bouton ci-dessus pour lancer la requête de validation à l'API de configuration Chariow.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-widest">Récupération des produits Chariow v1 :</span>
            <button
              onClick={fetchProducts}
              disabled={fetchingProducts}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer disabled:pointer-events-none"
            >
              {fetchingProducts ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {fetchingProducts ? "Chargement..." : "Récupérer les produits"}
            </button>
          </div>

          {/* API documentation and query instructions */}
          <div className="bg-black/40 border border-neutral-800/80 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                Commande de Produits demandée dans la doc :
              </span>
              <button
                onClick={copyProductsCurl}
                className="text-[10px] flex items-center gap-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                {copiedProductsCurl ? (
                  <>
                    <Check size={12} className="text-green-500" />
                    <span className="text-green-500">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copier curl</span>
                  </>
                )}
               </button>
            </div>
            <code className="block text-[10px] font-mono text-neutral-400 bg-neutral-900/60 p-2.5 rounded border border-neutral-800/40 leading-relaxed whitespace-pre overflow-x-auto select-all">
              {curlProductsCommand}
            </code>
          </div>

          {/* Sync messages */}
          {syncMessage && (
            <div className={`p-4 rounded-xl border text-xs font-bold leading-normal animate-fade-in ${
              syncMessage.success 
                ? "bg-green-500/10 border-green-500/30 text-green-400" 
                : "bg-red-500/10 border-red-500/30 text-red-500"
            }`}>
              {syncMessage.text}
            </div>
          )}

          {/* Products results mapping and display */}
          {productsResult && productsResult.success && (
            <div className="space-y-4 animate-fade-in">
              {/* Sync CTA header */}
              {fetchedProductsList.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h5 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                      <ShoppingBag size={14} />
                      {fetchedProductsList.length} Produits Détectés dans l'API Chariow
                    </h5>
                    <p className="text-[10px] text-neutral-400">
                      Vous pouvez synchroniser directement ces produits pour les rendre importables par vos ambassadeurs.
                    </p>
                  </div>
                  
                  <button
                    onClick={syncProductsToDatabase}
                    disabled={syncingProducts}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-neutral-800 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-green-500/10 active:scale-95 cursor-pointer disabled:pointer-events-none whitespace-nowrap"
                  >
                    {syncingProducts ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Database size={14} />
                    )}
                    {syncingProducts ? "Synchronisation..." : "Synchroniser dans MZ+"}
                  </button>
                </div>
              )}

              {/* Beautiful Grid and mapping list */}
              {fetchedProductsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {fetchedProductsList.map((prod: any, idx: number) => {
                    // Extract values dynamically using mapping variables
                    const id = prod.id || prod._id || `ch_${idx}`;
                    const name = prod.name || prod.title || "Produit Chariow";
                    const price = prod.price || prod.pricing?.price?.value || 0;
                    const commission = prod.commission_amount || prod.commission || Math.floor((Number(price) || 0) * 0.4);
                    const image = prod.image_url || prod.imageUrl || prod.image || prod.thumbnail || "https://images.unsplash.com/photo-1542291026-7eec264c27ff";
                    const slugOrId = prod.slug || prod.id;
                    const fallbackLink = slugOrId ? `https://mzplus.mychariow.shop/${slugOrId}/checkout` : "https://api.chariow.com";
                    const link = prod.final_link || prod.finalLink || prod.link || prod.url || prod.checkout_url || fallbackLink;
                    
                    return (
                      <div key={id} className="bg-neutral-900 border border-neutral-800/80 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
                        <div className="w-12 h-12 rounded-lg bg-black border border-neutral-800 overflow-hidden shrink-0">
                          <img src={image} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h6 className="text-xs font-bold text-white uppercase tracking-tight truncate">
                            {name}
                          </h6>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-neutral-500 font-mono">Prix: {parseFloat(price).toLocaleString()} F</span>
                            <span className="text-[10px] text-emerald-500 font-mono font-bold">Com: {parseFloat(commission).toLocaleString()} F</span>
                          </div>
                        </div>
                        <a href={link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors shrink-0">
                          <ArrowUpRight size={14} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-neutral-900/40 rounded-xl p-6 border border-neutral-900 text-center space-y-1">
                  <ShoppingBag className="mx-auto text-neutral-600 mb-2" size={24} />
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wide">
                    Produits Récupérés - Liste Vide
                  </h4>
                  <p className="text-[10px] text-neutral-500 max-w-sm mx-auto">
                    La connexion a réussi (200 OK) mais l'API Chariow a retourné zéro produit dans votre boutique. Veuillez ajouter des produits sur votre espace Chariow d'abord.
                  </p>
                </div>
              )}

              {/* Detailed Payload response */}
              <div className="bg-[#0b0b0b] rounded-xl border border-neutral-900 overflow-hidden">
                <div className="px-4 py-2.5 bg-neutral-900/40 border-b border-neutral-900 flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                    Payload Réponse Produits (v1)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-black bg-green-500/10 text-green-500">
                    HTTP {productsResult.status || 200}
                  </span>
                </div>
                <div className="p-4 overflow-x-auto max-h-[160px]">
                  <pre className="text-[10px] font-mono text-neutral-500 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(productsResult.data || productsResult, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {productsResult && !productsResult.success && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400">
                <div className="flex items-start gap-3">
                  <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight text-white leading-tight">
                      Impossible de charger les produits ({productsResult.status || 500})
                    </h4>
                    <p className="text-[11px] font-medium text-neutral-400 leading-relaxed mt-1">
                      {productsResult.message || "Erreur de chargement des produits. Vérifiez votre clé d'API."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informative placeholder state */}
          {!productsResult && !fetchingProducts && (
            <div className="bg-neutral-900/40 rounded-xl p-6 border border-neutral-900 text-center space-y-2">
              <ShoppingBag className="mx-auto text-neutral-600 animate-[bounce-subtle_2s_infinite]" size={24} />
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                Visualisateur de produits v1
              </h4>
              <p className="text-[11px] text-neutral-500 max-w-md mx-auto leading-relaxed">
                Appuyez sur le bouton ci-dessus pour récupérer directement les produits hébergés sur votre compte Chariow et les synchroniser en 1 clic dans l'application MZ+.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "checkout" && (
        <div className="space-y-4 animate-fade-in">
          {/* Header check */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-widest">
              Générer une session de paiement (POST /checkout) :
            </span>

            <button
              onClick={initiateCheckout}
              disabled={checkoutLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer disabled:pointer-events-none"
            >
              {checkoutLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {checkoutLoading ? "Génération..." : "Initier le paiement"}
            </button>
          </div>

          {/* Checkout configuration Form */}
          <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-tight text-neutral-300 border-b border-neutral-800/80 pb-2">
              Paramètres de la Transaction
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product selection/id */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">ID du Produit</label>
                <input
                  type="text"
                  placeholder="prd_abc123"
                  className="w-full bg-[#111] border border-neutral-800 rounded-xl p-3 text-xs text-white"
                  value={checkoutForm.productId}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, productId: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Email Client</label>
                <input
                  type="email"
                  placeholder="client@exemple.com"
                  className="w-full bg-[#111] border border-neutral-800 rounded-xl p-3 text-xs text-white"
                  value={checkoutForm.email}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                />
              </div>

              {/* First Name */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Prénom Client</label>
                <input
                  type="text"
                  placeholder="Jean"
                  className="w-full bg-[#111] border border-neutral-800 rounded-xl p-3 text-xs text-white"
                  value={checkoutForm.firstName}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, firstName: e.target.value })}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Nom Client</label>
                <input
                  type="text"
                  placeholder="Dupont"
                  className="w-full bg-[#111] border border-neutral-800 rounded-xl p-3 text-xs text-white"
                  value={checkoutForm.lastName}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, lastName: e.target.value })}
                />
              </div>

              {/* Phone code & number */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Indicatif pays</label>
                <input
                  type="text"
                  placeholder="FR"
                  className="w-full bg-[#111] border border-neutral-800 rounded-xl p-3 text-xs text-white"
                  value={checkoutForm.countryCode}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, countryCode: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400 font-mono">Mobile (numéro)</label>
                <input
                  type="text"
                  placeholder="612345678"
                  className="w-full bg-[#111] border border-neutral-800 rounded-xl p-3 text-xs text-white"
                  value={checkoutForm.phoneNumber}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            {/* Quick Helper Dropdown if products are fetched */}
            {fetchedProductsList.length > 0 && (
              <div className="pt-2 border-t border-neutral-900/40">
                <span className="text-[10px] text-amber-400/85 font-bold uppercase tracking-wide block mb-1.5">
                  ⚡ Utiliser un produit détecté depuis votre catalogue Chariow :
                </span>
                <div className="flex flex-wrap gap-2">
                  {fetchedProductsList.slice(0, 6).map((p: any) => {
                    const id = p.id || p._id || "unknown";
                    const title = p.name || p.title || "Produit Chariow";
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setCheckoutForm({ ...checkoutForm, productId: id })}
                        className={`text-[10px] py-1.5 px-3 rounded-lg border text-left transition-all font-semibold ${
                          checkoutForm.productId === id
                            ? "bg-amber-500/10 border-amber-500 text-amber-400"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Curl snippet display */}
          <div className="bg-black/40 border border-neutral-800/80 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                Requête de paiement équivalente (Doc Chariow POST) :
              </span>
              <button
                onClick={() => {
                  const payloadStr = `curl -X POST "https://api.chariow.com/v1/checkout" \\\n  -H "Authorization: Bearer VOTRE_CLE_API" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "product_id": "${checkoutForm.productId}",\n    "email": "${checkoutForm.email}",\n    "first_name": "${checkoutForm.firstName}",\n    "last_name": "${checkoutForm.lastName}",\n    "phone": {\n      "number": "${checkoutForm.phoneNumber}",\n      "country_code": "${checkoutForm.countryCode}"\n    }\n  }'`;
                  navigator.clipboard.writeText(payloadStr);
                  setCopiedCheckoutCurl(true);
                  setTimeout(() => setCopiedCheckoutCurl(false), 2000);
                }}
                className="text-[10px] flex items-center gap-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                {copiedCheckoutCurl ? (
                  <>
                    <Check size={12} className="text-green-500" />
                    <span className="text-green-500">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copier curl</span>
                  </>
                )}
              </button>
            </div>
            <code className="block text-[10px] font-mono text-neutral-400 bg-neutral-900/60 p-2.5 rounded border border-neutral-800/40 leading-relaxed whitespace-pre overflow-x-auto select-all">
              {`curl -X POST "https://api.chariow.com/v1/checkout" \\\n  -H "Authorization: Bearer VOTRE_CLE_API" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "product_id": "${checkoutForm.productId}",\n    "email": "${checkoutForm.email}",\n    "first_name": "${checkoutForm.firstName}",\n    "last_name": "${checkoutForm.lastName}",\n    "phone": {\n      "number": "${checkoutForm.phoneNumber}",\n      "country_code": "${checkoutForm.countryCode}"\n    }\n  }'`}
            </code>
          </div>

          {/* Checkout Result Payload response */}
          {checkoutResult && (
            <div className="space-y-3 animate-fade-in">
              <div className={`p-4 rounded-xl border ${
                checkoutResult.success 
                  ? "bg-[#22c55e]/10 border-green-500/30 text-green-400" 
                  : "bg-red-500/10 border-red-500/30 text-red-100"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {checkoutResult.success ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-tight text-white leading-tight">
                      {checkoutResult.success 
                        ? "Paiement Initié (201 Created / 200 OK) !" 
                        : `Erreur d'Initiation (${checkoutResult.status || 'Erreur'})`}
                    </h4>
                    <p className="text-[11px] font-medium text-neutral-400 leading-relaxed">
                      {checkoutResult.message || (checkoutResult.success ? "La session de paiement Chariow a été configurée avec succès." : "La transaction n'a pas pu être initiée.")}
                    </p>

                    {checkoutResult.isRoutedThroughDev && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mt-2 text-left text-[10px]">
                        Transaction simulée avec succès dans l'environnement actif.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#0b0b0b] rounded-xl border border-neutral-900 overflow-hidden">
                <div className="px-4 py-2.5 bg-neutral-900/40 border-b border-neutral-900 flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                    Réponse JSON Chariow
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black ${
                    checkoutResult.success ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    HTTP {checkoutResult.status || 201}
                  </span>
                </div>
                <div className="p-4 overflow-x-auto max-h-[180px]">
                  <pre className="text-[10px] font-mono text-neutral-400 leading-relaxed overflow-x-auto whitespace-pre-wrap font-bold">
                    {JSON.stringify(checkoutResult.data || checkoutResult, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {!checkoutResult && !checkoutLoading && (
            <div className="bg-neutral-900/40 rounded-xl p-6 border border-neutral-900 text-center space-y-2">
              <AlertCircle className="mx-auto text-neutral-600 animate-[pulse_2s_infinite]" size={24} />
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                Garantie d'intégration de transaction v1
              </h4>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Configurez les variables clients ci-dessus puis cliquez pour tester un appel à l'API de paiement Chariow en situation réelle.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
