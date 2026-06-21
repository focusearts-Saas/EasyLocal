'use client';

import { useState } from 'react';

interface Props {
  postText: string;
  imageUrl: string;
  uploadingImage: boolean;
  buttonType: string;
  buttonUrl: string;
  scheduledDate: string;
  generatingAIPost?: boolean;
  gbpTitle?: string;
  
  // Novos campos para Ofertas e Eventos
  topicType: string;
  eventTitle: string;
  eventStartDate: string;
  eventEndDate: string;
  offerCouponCode: string;
  offerRedeemUrl: string;
  offerTerms: string;

  setPostText: (v: string) => void;
  setImageUrl: (v: string) => void;
  setButtonType: (v: string) => void;
  setButtonUrl: (v: string) => void;
  setScheduledDate: (v: string) => void;
  
  // Setters dos novos campos
  setTopicType: (v: string) => void;
  setEventTitle: (v: string) => void;
  setEventStartDate: (v: string) => void;
  setEventEndDate: (v: string) => void;
  setOfferCouponCode: (v: string) => void;
  setOfferRedeemUrl: (v: string) => void;
  setOfferTerms: (v: string) => void;

  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePost: () => void;
  handleGenerateAIPost?: (topic: string) => void;
  scheduledPosts?: any[];
  handleDeleteScheduledPost?: (id: string) => void;
  editingPostId?: string | null;
  handleEditScheduledPost?: (post: any) => void;
  cancelEdit?: () => void;
}

export default function TabGBPPosts({
  postText, imageUrl, uploadingImage, buttonType, buttonUrl, scheduledDate,
  generatingAIPost, gbpTitle, scheduledPosts, editingPostId,
  topicType, eventTitle, eventStartDate, eventEndDate, offerCouponCode, offerRedeemUrl, offerTerms,
  setPostText, setImageUrl, setButtonType, setButtonUrl, setScheduledDate,
  setTopicType, setEventTitle, setEventStartDate, setEventEndDate, setOfferCouponCode, setOfferRedeemUrl, setOfferTerms,
  handleImageUpload, handlePost, handleGenerateAIPost, handleDeleteScheduledPost,
  handleEditScheduledPost, cancelEdit
}: Props) {
  const [aiPrompt, setAiPrompt] = useState('');

  const getTopics = () => {
    const title = (gbpTitle || '').toLowerCase();
    if (title.includes('amor & patas') || title.includes('pet shop')) return ['Banho e Tosa', 'Saúde Animal', 'Acessórios Pet', 'Curiosidades Pet'];
    if (title.includes('chaveiro urgente') || title.includes('chaveiro')) return ['Emergências 24h', 'Chaves Codificadas', 'Dicas de Segurança', 'Fechaduras Digitais'];
    if (title.includes('pagani') || title.includes('moto')) return ['Revisão Geral', 'Customização', 'Acessórios Moto', 'Dicas de Pilotagem'];
    if (title.includes('simone') || title.includes('podologia')) return ['Tratamento de Calos', 'Unha Encravada', 'Saúde dos Pés', 'Prevenção'];
    if (title.includes('soft english') || title.includes('inglês')) return ['Dicas de Pronúncia', 'Inglês para Negócios', 'Aulas de Conversação', 'Expressões Úteis'];
    
    return ['Nossos Serviços', 'Novidades', 'Promoções Imperdíveis', 'Dicas Rápidas'];
  };

  const topics = getTopics();

  const getMinDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const getMaxDateTime = () => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const offset = lastDayOfMonth.getTimezoneOffset() * 60000;
    return new Date(lastDayOfMonth.getTime() - offset).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <h2 className="text-2xl font-bold mb-2">📣 Publicações do Perfil</h2>
      <p className="text-gray-400 mb-8">Crie atualizações, eventos ou ofertas para manter o perfil ativo no Google.</p>
      
      <div className="glass-card rounded-2xl p-8 lg:p-10 shadow-[0_0_30px_rgba(0,255,157,0.05)] border-[#00ff9d]/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff9d] to-transparent opacity-50"></div>
        <div className="space-y-8 relative z-10">
          
          {editingPostId && (
            <div className="bg-[#ffbb00]/10 border border-[#ffbb00]/30 rounded-xl p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-sm">📝</span>
                <span className="text-xs font-bold text-[#ffbb00]">Editando agendamento ativo...</span>
              </div>
              <button 
                onClick={cancelEdit}
                className="text-[10px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-colors font-bold uppercase tracking-wider"
              >
                Cancelar Edição
              </button>
            </div>
          )}

          {/* Seletor do Tipo de Postagem (Atualização, Oferta, Evento) */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tipo de Postagem</label>
            <div className="flex flex-wrap gap-3">
              {[
                { type: 'STANDARD', label: '📝 Atualização' },
                { type: 'OFFER', label: '🏷️ Oferta' },
                { type: 'EVENT', label: '📅 Evento' }
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setTopicType(item.type)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border ${
                    topicType === item.type 
                      ? 'bg-[#00ff9d]/10 border-[#00ff9d] text-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.15)]' 
                      : 'bg-white dark:bg-[#161b22] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gerador de IA Section (Apenas para posts normais/STANDARD) */}
          {topicType === 'STANDARD' && (
            <div className="bg-gray-50 dark:bg-[#11161d] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-inner">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <label className="block text-[10px] font-bold text-[#00ff9d] uppercase tracking-widest flex items-center gap-2">
                  <span className="text-sm">✨</span> Gerador de Postagens por IA
                </label>
              </div>
              
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2 font-medium">Tópicos Sugeridos para o seu perfil:</p>
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <button 
                      key={topic} 
                      onClick={() => handleGenerateAIPost && handleGenerateAIPost(topic)}
                      disabled={generatingAIPost}
                      className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-[#00ff9d]/10 border border-gray-200 dark:border-gray-800 hover:border-[#00ff9d]/50 text-gray-600 dark:text-gray-300 hover:text-[#00ff9d] rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ou digite uma palavra ou ideia (ex: promoção de feriado)"
                  className="flex-1 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium"
                />
                <button 
                  onClick={() => handleGenerateAIPost && aiPrompt && handleGenerateAIPost(aiPrompt)}
                  disabled={generatingAIPost || !aiPrompt}
                  className="bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/30 px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generatingAIPost ? <span className="animate-pulse">⏳ Gerando...</span> : 'Gerar Texto'}
                </button>
              </div>
            </div>
          )}

          {/* Campo de Título para Eventos e Ofertas */}
          {(topicType === 'EVENT' || topicType === 'OFFER') && (
            <div className="space-y-2 animate-fade-in">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Título do {topicType === 'EVENT' ? 'Evento' : 'Oferta'} <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                required
                maxLength={58}
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                placeholder={topicType === 'EVENT' ? 'Ex: Inauguração da Nova Filial' : 'Ex: 20% de Desconto em Todo o Site'}
                className="w-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium"
              />
              <div className="text-right text-[10px] text-gray-500 font-medium">{eventTitle.length} / 58</div>
            </div>
          )}

          {/* Campo de Mensagem / Descrição */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              {topicType === 'STANDARD' ? 'Mensagem para os clientes' : 'Descrição'}
            </label>
            <textarea 
              value={postText} 
              onChange={(e) => setPostText(e.target.value)}
              placeholder={topicType === 'STANDARD' ? "Ex: Estamos abertos no feriado! Venha nos visitar..." : "Ex: Detalhes sobre o evento ou termos gerais da promoção..."}
              className="w-full h-40 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] resize-none font-medium" 
            />
            <div className="text-right text-[11px] text-gray-500 mt-2 font-medium">{postText.length} / 1500</div>
          </div>

          {/* Datas de Início e Fim (Apenas para Eventos e Ofertas) */}
          {(topicType === 'EVENT' || topicType === 'OFFER') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Data e Hora de Início <span className="text-red-500">*</span>
                </label>
                <input 
                  type="datetime-local" 
                  value={eventStartDate} 
                  onChange={e => setEventStartDate(e.target.value)}
                  className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Data e Hora de Término <span className="text-red-500">*</span>
                </label>
                <input 
                  type="datetime-local" 
                  value={eventEndDate} 
                  onChange={e => setEventEndDate(e.target.value)}
                  className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Detalhes específicos de Ofertas */}
          {topicType === 'OFFER' && (
            <div className="space-y-6 animate-fade-in border-t border-gray-850 pt-6">
              <h3 className="text-xs font-bold text-[#00ff9d] uppercase tracking-widest">Detalhes Adicionais da Oferta</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Código do Cupom (Opcional)</label>
                  <input 
                    type="text" 
                    value={offerCouponCode} 
                    onChange={e => setOfferCouponCode(e.target.value)}
                    placeholder="Ex: SAVE20"
                    className="w-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Link de Resgate Online (Opcional)</label>
                  <input 
                    type="url" 
                    value={offerRedeemUrl} 
                    onChange={e => setOfferRedeemUrl(e.target.value)}
                    placeholder="https://sua-loja.com/desconto"
                    className="w-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Termos e Condições (Opcional)</label>
                <textarea 
                  value={offerTerms} 
                  onChange={e => setOfferTerms(e.target.value)}
                  placeholder="Ex: Válido apenas para novos clientes. Limite de 1 cupom por CPF."
                  className="w-full h-24 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00ff9d] resize-none font-medium"
                />
              </div>
            </div>
          )}

          {/* Mídia e Botão de Ação (CTAs são ignorados para Ofertas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Foto (Opcional)</label>
              <div className={`border-2 border-dashed ${imageUrl ? 'border-[#00ff9d]' : 'border-gray-300 dark:border-gray-800 hover:border-[#00ff9d]/50'} rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-40 transition-colors bg-gray-50 dark:bg-[#161b22]`}>
                {imageUrl ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <button onClick={() => setImageUrl('')} className="bg-red-500/90 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl hover:bg-red-500 transition-colors">🗑️ Remover</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-3 drop-shadow-[0_0_10px_rgba(0,255,157,0.2)]">📸</div>
                    <p className="text-xs text-gray-400 font-medium">Clique para selecionar</p>
                    {uploadingImage && <p className="text-[#00ff9d] text-xs font-bold mt-3 animate-pulse">⏳ Fazendo upload...</p>}
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>

            {/* CTAs ocultos para ofertas porque elas têm o próprio redeemOnlineUrl */}
            {topicType !== 'OFFER' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Botão de Ação (CTA)</label>
                  <div className="relative">
                    <select value={buttonType} onChange={e => setButtonType(e.target.value)}
                      className="w-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00ff9d] appearance-none cursor-pointer font-medium">
                      <option value="NONE">Nenhum botão</option>
                      <option value="LEARN_MORE">🔗 Saiba Mais</option>
                      <option value="BOOK">📅 Reservar</option>
                      <option value="ORDER">🛍️ Fazer Pedido</option>
                      <option value="CALL">📞 Ligar Agora</option>
                    </select>
                  </div>
                </div>
                {(buttonType !== 'NONE' && buttonType !== 'CALL') && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">URL de Destino</label>
                    <input type="url" value={buttonUrl} onChange={e => setButtonUrl(e.target.value)}
                      placeholder="https://seudominio.com.br"
                      className="w-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium" />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-[#11161d] rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-center text-xs text-gray-500 font-medium">
                📢 Em postagens de Oferta, o link de resgate preenchido acima será exibido automaticamente como botão principal no Google.
              </div>
            )}
          </div>
        </div>

        {/* Rodapé e Programação */}
        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50 dark:bg-[#0d1117]/50 -mx-8 lg:-mx-10 -mb-8 lg:-mb-10 p-8 lg:p-10 rounded-b-2xl relative z-10">
          <div className="w-full md:w-auto">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Agendar Postagem? (Opcional)</label>
            <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
              min={getMinDateTime()} max={getMaxDateTime()}
              className="w-full md:w-64 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00ff9d] font-medium cursor-pointer" />
          </div>
          <button 
            onClick={handlePost} 
            disabled={!postText || ((topicType === 'EVENT' || topicType === 'OFFER') && (!eventTitle || !eventStartDate || !eventEndDate))}
            className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-sm transition-all shadow-lg ${
              (postText && (topicType === 'STANDARD' || (eventTitle && eventStartDate && eventEndDate)))
                ? (editingPostId || scheduledDate 
                    ? 'bg-[#ffbb00] text-gray-900 hover:bg-yellow-400 shadow-[0_0_15px_rgba(255,187,0,0.3)]' 
                    : 'bg-[#00ff9d] text-gray-900 shadow-[0_0_15px_rgba(0,255,157,0.3)]') 
                : 'bg-gray-100 dark:bg-[#161b22] text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {editingPostId ? '💾 Salvar Alterações' : scheduledDate ? '🕒 Agendar no Banco' : '🚀 Publicar no Google'}
          </button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {scheduledPosts && scheduledPosts.length > 0 && (
        <div className="mt-12 space-y-4 animate-fade-in">
          <h3 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">🗓️ Postagens Agendadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledPosts.map((post: any) => (
              <div key={post.id} className="bg-[#11161d] border border-gray-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  post.topic_type === 'OFFER' ? 'bg-[#00ff9d]' :
                  post.topic_type === 'EVENT' ? 'bg-blue-500' : 'bg-[#ffbb00]'
                }`}></div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      post.topic_type === 'OFFER' ? 'bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/30' :
                      post.topic_type === 'EVENT' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                      'bg-[#ffbb00]/20 text-[#ffbb00] border border-[#ffbb00]/30'
                    }`}>
                      {post.topic_type === 'OFFER' ? '🏷️ Oferta' : post.topic_type === 'EVENT' ? '📅 Evento' : '📝 Atualização'}
                    </span>
                    <span className="text-xs text-gray-400 font-bold bg-[#161b22] px-2 py-1 rounded-md border border-gray-800">
                      {new Date(post.scheduled_for).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  
                  {post.event_title && (
                    <h4 className="text-sm font-bold text-white mb-1">{post.event_title}</h4>
                  )}
                  
                  <p className="text-sm text-gray-300 line-clamp-4 leading-relaxed font-medium">{post.content}</p>
                  
                  {(post.event_start_date && post.event_end_date) && (
                    <div className="mt-3 text-[11px] text-gray-400 bg-[#161b22] p-2 rounded-lg border border-gray-800">
                      📅 <strong>Período:</strong><br />
                      De: {new Date(post.event_start_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}<br />
                      Até: {new Date(post.event_end_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  )}
                </div>
                
                {post.image_url && (
                  <div className="h-32 w-full bg-cover bg-center rounded-lg mb-4 border border-gray-800 shadow-inner" style={{ backgroundImage: `url(${post.image_url})` }}></div>
                )}
                
                <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-800">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">
                    {post.topic_type === 'OFFER' ? (
                      post.offer_coupon_code ? `Cupom: ${post.offer_coupon_code}` : 'Oferta ativa'
                    ) : (
                      `CTA: ${post.button_type === 'NONE' ? 'Nenhum' : post.button_type}`
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditScheduledPost && handleEditScheduledPost(post)}
                      className="text-xs text-[#ffbb00] hover:text-[#ffbb00]/80 font-bold px-3 py-1.5 bg-[#ffbb00]/10 hover:bg-[#ffbb00]/20 rounded-lg transition-colors border border-[#ffbb00]/20"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteScheduledPost && handleDeleteScheduledPost(post.id)}
                      className="text-xs text-red-500 hover:text-red-400 font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
