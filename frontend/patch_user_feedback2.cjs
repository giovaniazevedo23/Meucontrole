const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
const lines = app.split('\n');

const detailsModalNew = `      {systemDetailsModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2>Detalhes do Pedido #{systemDetailsModal.id.slice(-6).toUpperCase()}</h2>
              <button className="close-btn" onClick={() => setSystemDetailsModal(null)}>×</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>👤 Dados do Cliente</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong>Nome:</strong> {systemDetailsModal.client || 'Não informado'}</div>
                  <div><strong>CPF/CNPJ:</strong> {systemDetailsModal.cpf || systemDetailsModal.customerCpf || 'Não informado'}</div>
                  <div><strong>E-mail:</strong> {systemDetailsModal.email || systemDetailsModal.customerEmail || 'Não informado'}</div>
                  <div><strong>Telefone:</strong> {systemDetailsModal.phone || systemDetailsModal.customerPhone || 'Não informado'}</div>
                  <div><strong>Nascimento:</strong> {systemDetailsModal.birthday ? new Date(systemDetailsModal.birthday + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informado'}</div>
                  <div><strong>Endereço:</strong> {systemDetailsModal.address || 'Não informado'}</div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>📄 Detalhes do Pedido</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong>Data e Hora:</strong> {systemDetailsModal.date ? new Date(systemDetailsModal.date).toLocaleString('pt-BR') : 'Não informado'}</div>
                  <div><strong>Origem:</strong> {systemDetailsModal.source === 'vitrine' ? 'Online (Vitrine Virtual)' : 'Venda Física (Balcão/CRM)'}</div>
                  <div><strong>Vendedor:</strong> {systemDetailsModal.salesperson || 'Nenhum / Auto-atendimento'}</div>
                  <div><strong>Prazo de Entrega:</strong> {systemDetailsModal.maxDeliveryDays ? systemDetailsModal.maxDeliveryDays + ' dias úteis' : 'Não aplicável'}</div>
                  <div><strong>Status do Pedido:</strong> <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{systemDetailsModal.status}</span></div>
                  <div><strong>Status de Entrega:</strong> {systemDetailsModal.shippingStatus || 'Aguardando'}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
              <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>💰 Pagamento e Produtos</h3>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Método de Pagamento:</strong> {systemDetailsModal.paymentMethod || systemDetailsModal.checkoutMethod || 'Não informado'}
              </div>
              
              {systemDetailsModal.products && systemDetailsModal.products.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.05)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>SKU</th>
                        <th style={{ padding: '0.75rem' }}>Produto</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qtd</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>V. Unitário</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemDetailsModal.products.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '0.75rem' }}>{p.sku || p.id || '-'}</td>
                          <td style={{ padding: '0.75rem' }}>{p.name || p.title}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{p.quantity || p.cartQuantity || 1}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>R$ {Number(p.price || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>R$ {(Number(p.price || 0) * (p.quantity || p.cartQuantity || 1)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>Total Geral:</td>
                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--success)' }}>
                          R$ {Number(systemDetailsModal.value || systemDetailsModal.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Nenhum produto listado neste pedido.</p>
              )}
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => window.print()} style={{ padding: '0.75rem 2rem' }}>🖨️ Imprimir Recibo</button>
              <button className="btn-primary" onClick={() => setSystemDetailsModal(null)} style={{ padding: '0.75rem 3rem' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}`;

lines.splice(2768, 2790 - 2768 + 1, detailsModalNew);

fs.writeFileSync('src/App.jsx', lines.join('\n'), 'utf8');
console.log('Done rewriting modal.');
