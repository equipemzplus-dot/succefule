import React, { useState } from "react";
import { Terminal, RefreshCw, CheckCircle, XCircle, AlertCircle, Copy, Check } from "lucide-react";

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  message?: string;
  error?: string;
  details?: string;
  data?: unknown;
  detectedKeyLength?: number;
  detectedKeyPreview?: string;
  isRoutedThroughDev?: boolean;
}

export const ChariowTestConsole: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [copied, setCopied] = useState(false);

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

  const curlCommand = `curl -X GET "https://api.chariow.com/v1/store" \\\n  -H "Authorization: Bearer VOTRE_CLE_API"`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="chariow-test-console" className="w-full bg-[#111] border border-neutral-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Terminal size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-white leading-tight">
              Console API Chariow
            </h3>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
              Test de connectivité en direct
            </p>
          </div>
        </div>

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

      <div className="space-y-4">
        {/* API documentation and query instructions */}
        <div className="bg-black/40 border border-neutral-800/80 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
              Commande de Test demandée :
            </span>
            <button
              onClick={copyCurl}
              className="text-[10px] flex items-center gap-1 text-neutral-500 hover:text-white transition-colors"
            >
              {copied ? (
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
            {curlCommand}
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
                    {result.message}
                  </p>
                  
                  {result.error === "missing_api_key" && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mt-4 text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-400 mb-2">
                        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        Guide d'activation sur Netlify (Production)
                      </p>
                      <p className="text-[11px] text-neutral-300 leading-normal mb-3">
                        Pour que votre boutique en ligne à l'adresse <strong>beta4vi.netlify.app</strong> fonctionne automatiquement en production, vous devez enregistrer votre clé API Chariow dans les variables d'environnement de Netlify.
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5 text-[10px] text-neutral-400">
                        <li>Connectez-vous à votre compte <strong className="text-white">Netlify Dashboard</strong>.</li>
                        <li>Allez dans l'onglet des paramètres de votre site : <strong className="text-white">Site configuration &gt; Environment variables</strong>.</li>
                        <li>Cliquez sur <strong className="text-white">Add a variable</strong> (Ajouter une variable).</li>
                        <li>Entrez <code className="bg-neutral-900 px-1.5 py-0.5 border border-white/10 rounded font-mono text-white text-[9px]">CHARIOW_API_KEY</code> comme nom de clé (Key).</li>
                        <li>Collez votre clé secrète Chariow (commençant généralement par <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-300 text-[9px] font-mono">ch_...</code>) comme valeur (Value).</li>
                        <li>Sauvegardez l'enregistrement puis faites un <strong className="text-white">Trigger deploy</strong> (Relancer le déploiement) pour appliquer la modification.</li>
                      </ol>
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
                        Connexion validée via AI Studio sandbox
                      </p>
                      <p className="text-[10px] text-neutral-300 leading-normal mt-1 flex-wrap">
                        La connexion a été testée et validée avec succès grâce à la clé API présente dans votre environnement de développement.
                      </p>
                      <div className="mt-2 text-[9px] text-amber-300/90 leading-tight bg-amber-950/20 p-2 rounded border border-amber-500/10">
                        <strong>Standard Netlify :</strong> Pour faire fonctionner votre site en production à l'adresse <code className="bg-amber-950/60 px-1 py-0.5 rounded text-white text-[8px]">beta4vi.netlify.app</code> de manière autonome, ajoutez simplement la variable <code className="bg-amber-950/60 px-1 py-0.5 text-white rounded text-[8px]">CHARIOW_API_KEY</code> dans les paramètres de votre site sur votre dashboard Netlify.
                      </div>
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
              Cliquez sur le bouton ci-dessus pour lancer la requête de validation à l'API Chariow. Notre serveur transmettra l'appel en toute sécurité.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
