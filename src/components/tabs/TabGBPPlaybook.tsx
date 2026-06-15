'use client';

import React from 'react';
import { BookOpen, Download, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

export default function TabGBPPlaybook() {
  const pdfUrl = '/Google_Business_Growth_Playbook.pdf';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho de Destaque */}
      <div className="relative overflow-hidden bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#00ff9d]/20 rounded-3xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00ff9d]/5 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/20 text-[11px] font-black uppercase tracking-wider text-[#00c87b] dark:text-[#00ff9d]">
              <Sparkles size={12} className="animate-pulse" /> Material de Estudo do Gestor
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Playbook de Crescimento Local
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Descubra como dominar o ranking local do Google Maps, atrair dezenas de novos clientes todas as semanas e gerenciar sua reputação online de forma profissional com o nosso guia estruturado.
            </p>
          </div>

          <div className="flex flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto">
            <a
              href={pdfUrl}
              download="Playbook_Google_Business_Growth.pdf"
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all border border-gray-300 dark:border-white/10"
            >
              <Download size={14} /> Baixar PDF
            </a>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#00ff9d] hover:bg-[#00e08b] text-gray-900 font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,157,0.2)]"
            >
              <ExternalLink size={14} /> Abrir Tela Cheia
            </a>
          </div>
        </div>
      </div>

      {/* Grid de Informações & Visualizador */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Resumo do Guia */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-850 rounded-2xl p-6 shadow-md">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-[#00ff9d]" /> O que você vai aprender:
            </h3>
            
            <ul className="space-y-4">
              {[
                { title: 'Algoritmo de Busca', desc: 'Como o Google calcula Relevância, Distância e Destaque para te rankear.' },
                { title: 'Foco em Avaliações', desc: 'Táticas para incentivar avaliações de 5 estrelas sem ser chato ou insistente.' },
                { title: 'Postagens Estratégicas', desc: 'Como o fluxo de novidades e promoções alerta o Google de que você está ativo.' },
                { title: 'Manual de Crise', desc: 'Como responder a críticas negativas de forma a conquistar futuros clientes.' }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#00ff9d] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#00ff9d]/5 border border-[#00ff9d]/10 rounded-2xl p-6 relative overflow-hidden">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#00c87b] dark:text-[#00ff9d] mb-1">Dica de SEO Local</h4>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
              Consistência vence intensidade no Google Maps. Dedique apenas 15 minutos semanais para atualizar horários, responder às novas avaliações e fazer um post rápido. Essa rotina garante posições melhores que o concorrente que edita a ficha apenas a cada 6 meses.
            </p>
          </div>
        </div>

        {/* Lado Direito: Visualizador de PDF Embutido */}
        <div className="lg:col-span-2 flex flex-col h-[600px] bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-850 rounded-2xl overflow-hidden shadow-md">
          <div className="p-4 bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-850 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" /> Visualizador de Playbook
            </span>
            <span className="text-[10px] text-gray-500 font-medium">NotebookLM PDF</span>
          </div>

          <div className="flex-1 relative bg-gray-100 dark:bg-[#0c0f14]">
            {/* Iframe do PDF */}
            <iframe
              src={`${pdfUrl}#toolbar=0`}
              className="w-full h-full border-0"
              title="Google Business Growth Playbook"
            />
            
            {/* Aviso no Mobile (por segurança) */}
            <div className="absolute inset-0 flex lg:hidden flex-col items-center justify-center p-6 bg-white dark:bg-[#161b22] text-center space-y-4 pointer-events-none lg:pointer-events-auto">
              <BookOpen size={48} className="text-[#00ff9d]" />
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Visualização de PDF</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                Em dispositivos móveis, recomendamos abrir o arquivo em tela cheia para ter a melhor experiência de leitura.
              </p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto bg-[#00ff9d] hover:bg-[#00e08b] text-gray-900 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Abrir Playbook
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
