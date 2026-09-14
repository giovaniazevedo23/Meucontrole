          </div>
        )}

        {activeTab === 'sistema' && (
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', minHeight: '600px' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', position: 'relative', width: '100%', maxWidth: '600px' }}>
                <span style={{ position: 'absolute', left: '16px', top: '16px', fontSize: '1.2rem', opacity: 0.5 }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Buscar por cliente, CPF, pedido, NFe..." 
                  value={sistemaSearch}
                  onChange={e => setSistemaSearch(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '2rem', border: '2px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {(() => {
                if (!sistemaSearch || sistemaSearch.length < 2) return <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>Digite algo para pesquisar...</div>;
                const searchLower = sistemaSearch.toLowerCase();
                const matchedDeals = deals.filter(d => 
                  (d.client && d.client.toLowerCase().includes(searchLower)) ||
                  (d.cpf && d.cpf.includes(searchLower)) ||
                  (d.customerCpf && d.customerCpf.includes(searchLower)) ||
                  (d.id && d.id.toLowerCase().includes(searchLower)) ||
                  (d.document && d.document.toLowerCase().includes(searchLower))
                );

                if (matchedDeals.length === 0) return <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum resultado encontrado.</div>;

                return matchedDeals.map(deal => {
                  let badgeColor = 'var(--primary-color)';
                  let statusTitle = deal.status;
                  
                  if (deal.status === 'Novo') { badgeColor = 'var(--primary-color)'; statusTitle = 'Fila de Espera'; }
                  else if (deal.status === 'Em andamento') { badgeColor = 'var(--warning)'; statusTitle = 'Em Produção'; }
                  else if (deal.status === 'Aguardando') { badgeColor = '#9b59b6'; statusTitle = 'Aguardando Cliente'; }
                  else if (deal.status === 'Ganho' || deal.shippingStatus === 'Entregue') { badgeColor = 'var(--success)'; statusTitle = 'Concluído'; }
                  else if (deal.status === 'Perdido' || deal.shippingStatus === 'Cancelado') { badgeColor = 'var(--danger)'; statusTitle = 'Cancelado/Perdido'; }
                  
                  return (
                    <div key={deal.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', borderTop: `5px solid ${badgeColor}`, display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{deal.client || 'Cliente não informado'}</h3>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CPF: {deal.cpf || deal.customerCpf || 'N/A'}</div>
                        </div>
                        <div style={{ background: badgeColor, color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {statusTitle}
                        </div>
                      </div>
                      
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        <div style={{ marginBottom: '0.25rem' }}><strong>Mat:</strong> {deal.id.slice(-8).toUpperCase()}</div>
                        <div style={{ marginBottom: '0.25rem' }}><strong>Valor:</strong> R$ {Number(deal.value || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        {deal.shippingStatus && <div style={{ color: 'var(--text-secondary)' }}><strong>Envio:</strong> {deal.shippingStatus}</div>}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn-secondary" style={{ flex: 1, padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', borderColor: '#25D366', color: '#25D366' }} onClick={() => window.open(`https://wa.me/55${deal.phone?.replace(/\D/g, '') || deal.customerPhone?.replace(/\D/g, '')}`, '_blank')}>
                          WhatsApp
                        </button>
                        <button className="btn-secondary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => setTrackingModal({ dealId: deal.id, msg: '' })}>
                          Rastreio
                        </button>
                        <button className="btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => {
                          if (deal.source === 'vitrine') {
                            setActiveTab('pedidos');
                          } else {
                            setActiveTab('crm');
                          }
                        }}>
                          Detalhes
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

      </main>