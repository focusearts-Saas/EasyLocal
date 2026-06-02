'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Check, ArrowRight, AlertCircle, Building2, ExternalLink } from 'lucide-react';

export default function OnboardingPage() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [activatingLocation, setActivatingLocation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
      if (!session) {
        window.location.href = '/login';
      } else {
        checkExistingBusiness(session.access_token);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoadingSession(false);
      if (!newSession) {
        window.location.href = '/login';
      }
    });

    // Verificar se o Google acabou de ser conectado
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      setGoogleConnected(true);
    } else if (params.get('google_connected') === 'false') {
      setError('Falha ao conectar conta do Google. Tente novamente.');
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && googleConnected) {
      fetchGoogleLocations();
    }
  }, [session, googleConnected]);

  const checkExistingBusiness = async (token: string) => {
    try {
      const res = await fetch('/api/sites', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Usuário já tem um negócio cadastrado, manda para o dashboard
        window.location.href = '/';
      }
    } catch (e) {
      console.error('Erro ao verificar negócios existentes:', e);
    }
  };

  const handleConnectGoogle = () => {
    if (!session?.user?.id) return;
    window.location.href = `/api/auth/google?userId=${session.user.id}`;
  };

  const fetchGoogleLocations = async () => {
    if (!session?.access_token) return;
    setLoadingLocations(true);
    setError(null);
    try {
      const res = await fetch('/api/google/locations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (Array.isArray(data)) {
        setLocations(data);
        if (data.length === 0) {
          // Busca os dados nativos do Google para debugar
          fetch('/api/google/debug', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
            .then((r) => r.json())
            .then((debugRes) => setDebugData(debugRes))
            .catch(() => {});
        }
      }
    } catch (e) {
      console.error(e);
      setError('Erro de conexão ao buscar localizações do Google.');
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSelectLocation = async (loc: any) => {
    if (!session?.access_token) return;
    setActivatingLocation(loc.gbpLocationId);
    setError(null);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: loc.name,
          gbpLocationId: loc.gbpLocationId,
          gbpAccountId: loc.gbpAccountId,
          websiteUrl: loc.websiteUrl
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        // Redirecionar para o dashboard principal
        window.location.href = '/';
      } else {
        setError(result.error || 'Falha ao salvar o negócio local no banco de dados.');
      }
    } catch (e) {
      console.error(e);
      setError('Erro de comunicação ao salvar seu negócio.');
    } finally {
      setActivatingLocation(null);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#06090e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff9d]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06090e] text-[#f0f6fc] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00ff9d]/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[620px] z-10">
        
        {/* Header Logo */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-9 h-9 text-[#00ff9d] filter drop-shadow-[0_0_6px_rgba(0,255,157,0.4)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="onbLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00ff9d" />
                  <stop offset="100%" stopColor="#05c475" />
                </linearGradient>
              </defs>
              <path d="M50 15 L85 75 A4 4 0 0 1 81.5 81 L18.5 81 A4 4 0 0 1 15 75 Z" stroke="url(#onbLogoGrad)" strokeWidth="11" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M50 32 L70 67 L30 67 Z" fill="url(#onbLogoGrad)" fillOpacity="0.18" />
            </svg>
            <span className="text-2xl font-black tracking-tighter text-white">Easy<span className="text-[#00ff9d]">Local</span></span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white mt-4 uppercase">Configuração Inicial</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
            Integre o seu local do Google Meu Negócio em poucos passos para começar a responder reviews e otimizar seu posicionamento.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-xs font-bold flex items-center gap-3 border bg-rose-500/10 border-rose-500/30 text-rose-400 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-[#0d1117] border border-gray-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
          
          {!googleConnected ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#00ff9d]/5 border border-[#00ff9d]/20 flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-7 h-7 text-[#00ff9d]" />
              </div>
              <h3 className="text-white text-lg font-black uppercase tracking-tight mb-2">Conecte sua conta do Google</h3>
              <p className="text-gray-400 text-xs max-w-sm mx-auto mb-8 leading-relaxed">
                Precisamos de autorização para ler as avaliações, criar postagens e acompanhar suas métricas locais diretamente da API oficial do Google.
              </p>
              <button
                onClick={handleConnectGoogle}
                className="inline-flex items-center justify-center gap-2.5 bg-[#00ff9d] hover:bg-[#00e08b] text-gray-900 font-bold px-8 py-4 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-[#00ff9d]/10 hover:shadow-[#00ff9d]/20 active:scale-[0.98]"
              >
                <span>Conectar Conta do Google</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
                <div>
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Seus Locais no Maps</h3>
                  <p className="text-gray-400 text-[11px] mt-0.5">Selecione o local principal que você deseja gerenciar neste painel.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" />
                  <span>Google Conectado</span>
                </div>
              </div>

              {loadingLocations ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff9d]"></div>
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Buscando locais na sua conta Google...</span>
                </div>
              ) : locations.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                  <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-1">Nenhum Local Verificado</h4>
                  <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                    Não encontramos locais verificados nesta conta do Google. Certifique-se de que a conta conecta gerencia o perfil local no Google Maps.
                  </p>
                  <button 
                    onClick={handleConnectGoogle}
                    className="text-xs text-[#00ff9d] hover:underline font-bold mt-4 block mx-auto"
                  >
                    Tentar com outra conta Google
                  </button>
                  
                  {debugData && (
                    <div className="mt-6 text-left bg-black/50 p-4 rounded-lg border border-gray-800 overflow-auto max-h-[300px]">
                      <h5 className="text-[#00ff9d] text-[10px] font-bold uppercase mb-2">Google API Debug Log:</h5>
                      <pre className="text-[10px] text-gray-400 whitespace-pre-wrap font-mono">
                        {JSON.stringify(debugData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {locations.map((loc) => (
                    <div 
                      key={loc.gbpLocationId}
                      className="group bg-[#161b22]/50 hover:bg-[#161b22] border border-gray-800 hover:border-[#00ff9d]/30 rounded-xl p-4 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-800/80 flex items-center justify-center text-gray-400 group-hover:text-[#00ff9d] group-hover:bg-[#00ff9d]/5 transition-all">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-white text-xs font-bold group-hover:text-white transition-all">{loc.name}</h4>
                          {loc.websiteUrl && (
                            <a 
                              href={loc.websiteUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-gray-500 hover:text-[#00ff9d] inline-flex items-center gap-0.5 mt-0.5"
                            >
                              <span>{loc.websiteUrl}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectLocation(loc)}
                        disabled={activatingLocation !== null}
                        className="bg-[#00ff9d] hover:bg-[#00e08b] disabled:opacity-50 text-gray-900 text-[10px] font-black uppercase tracking-wider py-2 px-4 rounded-lg transition-all"
                      >
                        {activatingLocation === loc.gbpLocationId ? (
                          <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Ativar</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
