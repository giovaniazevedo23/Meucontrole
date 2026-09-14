const fs = require('fs');
let lines = fs.readFileSync('src/App.jsx', 'utf8').split('\r\n');

// 1. Remove the SVG from Produtos (lines 1661-1664)
lines.splice(1661, 4);

// 2. Find exact modal boundaries
let start = -1;
let end = -1;
let braces = 0;
for(let i=0; i<lines.length; i++) {
  if(lines[i].includes('{systemDetailsModal && (')) {
    start = i;
    braces = 1;
  } else if(start !== -1) {
    for(let j=0; j<lines[i].length; j++) {
      if(lines[i][j] === '{') braces++;
      else if(lines[i][j] === '}') braces--;
    }
    if(braces === 0) {
      end = i;
      break;
    }
  }
}

console.log('Modal boundaries:', start, end);

if (start !== -1 && end !== -1) {
  const newModal = [
    "      {systemDetailsModal && (() => {",
    "        // Enrich deal data with spreadsheet data if available",
    "        const d = systemDetailsModal;",
    "        const sheetPedidos = (sheetsData && sheetsData['Pedidos vitrine']) || [];",
    "        const sheetVendas = (sheetsData && sheetsData['Vendas e controle']) || [];",
    "        const matchingSheet = sheetPedidos.find(row => ",
    "          (row['CPF'] && d.cpf && row['CPF'] === d.cpf) ||",
    "          (row['CPF'] && d.customerCpf && row['CPF'] === d.customerCpf) ||",
    "          (row['USUARIO'] && d.client && row['USUARIO'].toLowerCase() === d.client.toLowerCase())",
    "        ) || sheetVendas.find(row => ",
    "          (row['NOME DOS CLIENTES'] && d.client && row['NOME DOS CLIENTES'].toLowerCase() === d.client.toLowerCase())",
    "        );",
    "        const enriched = {",
    "          ...d,",
    "          email: d.email || d.customerEmail || (matchingSheet && matchingSheet['EMAIL']) || 'Não informado',",
    "          address: d.address || (matchingSheet && matchingSheet['ENDEREÇO']) || 'Não informado',",
    "          phone: d.phone || d.customerPhone || (matchingSheet && matchingSheet['N° DE TEEFONE']) || 'Não informado',",
    "          salesperson: d.salesperson || (matchingSheet && matchingSheet['VENDEDOR ESCOLHIDO']) || 'Nenhum / Auto-atendimento',",
    "          paymentMethod: d.paymentMethod || d.checkoutMethod || (matchingSheet && matchingSheet['METODO DE PAGAMENTO']) || 'Não informado',",
    "          maxDeliveryDays: d.maxDeliveryDays || (matchingSheet && matchingSheet['PRAZO DE ENTREGA']) || '',",
    "          shippingStatus: d.shippingStatus || (matchingSheet && matchingSheet['STATUS DE ENTREGA']) || 'Aguardando',",
    "        };",
    "        return (",
    "        <div className=\"modal-overlay\" style={{ zIndex: 1200 }}>",
    "          <div className=\"modal-content glass-panel\" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>",
    "            <div className=\"modal-header\" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>",
    "              <h2>Detalhes do Pedido #{(d.id || 'N/A').slice(-6).toUpperCase()}</h2>",
    "              <button className=\"close-btn\" onClick={() => setSystemDetailsModal(null)}>×</button>",
    "            </div>",
    "            ",
    "            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>",
    "              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>",
    "                <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Dados do Cliente</h3>",
    "                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>",
    "                  <div><strong>Nome:</strong> {enriched.client || 'Não informado'}</div>",
    "                  <div><strong>CPF/CNPJ:</strong> {enriched.cpf || enriched.customerCpf || 'Não informado'}</div>",
    "                  <div><strong>E-mail:</strong> {enriched.email}</div>",
    "                  <div><strong>Telefone:</strong> {enriched.phone}</div>",
    "                  <div><strong>Nascimento:</strong> {enriched.birthday ? new Date(enriched.birthday + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informado'}</div>",
    "                  <div><strong>Endereço:</strong> {enriched.address}</div>",
    "                </div>",
    "              </div>",
    "              ",
    "              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>",
    "                <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Detalhes do Pedido</h3>",
    "                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>",
    "                  <div><strong>Data e Hora:</strong> {enriched.date ? new Date(enriched.date).toLocaleString('pt-BR') : 'Não informado'}</div>",
    "                  <div><strong>Origem:</strong> {enriched.source === 'vitrine' ? 'Online (Vitrine Virtual)' : 'Venda Física (Balcão/CRM)'}</div>",
    "                  <div><strong>Vendedor:</strong> {enriched.salesperson}</div>",
    "                  <div><strong>Prazo de Entrega:</strong> {enriched.maxDeliveryDays ? enriched.maxDeliveryDays + ' dias úteis' : 'Não aplicável'}</div>",
    "                  <div><strong>Status do Pedido:</strong> <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{enriched.status}</span></div>",
    "                  <div><strong>Status de Entrega:</strong> {enriched.shippingStatus}</div>",
    "                </div>",
    "              </div>",
    "            </div>",
    "",
    "            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>",
    "              <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Pagamento e Produtos</h3>",
    "              <div style={{ marginBottom: '1rem' }}>",
    "                <strong>Método de Pagamento:</strong> {enriched.paymentMethod}",
    "              </div>",
    "              ",
    "              {enriched.products && Array.isArray(enriched.products) && enriched.products.length > 0 ? (",
    "                <div style={{ overflowX: 'auto' }}>",
    "                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>",
    "                    <thead>",
    "                      <tr style={{ background: 'rgba(0,0,0,0.05)', textAlign: 'left' }}>",
    "                        <th style={{ padding: '0.75rem' }}>SKU</th>",
    "                        <th style={{ padding: '0.75rem' }}>Produto</th>",
    "                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qtd</th>",
    "                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>V. Unitário</th>",
    "                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Subtotal</th>",
    "                      </tr>",
    "                    </thead>",
    "                    <tbody>",
    "                      {enriched.products.map((p, i) => (",
    "                        <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>",
    "                          <td style={{ padding: '0.75rem' }}>{p.sku || p.id || '-'}</td>",
    "                          <td style={{ padding: '0.75rem' }}>{p.name || p.title}</td>",
    "                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{p.quantity || p.cartQuantity || 1}</td>",
    "                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>R$ {Number(p.price || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>",
    "                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>R$ {(Number(p.price || 0) * (p.quantity || p.cartQuantity || 1)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>",
    "                        </tr>",
    "                      ))}",
    "                    </tbody>",
    "                    <tfoot>",
    "                      <tr>",
    "                        <td colSpan=\"4\" style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>Total Geral:</td>",
    "                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--success)' }}>",
    "                          R$ {Number(enriched.value || enriched.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}",
    "                        </td>",
    "                      </tr>",
    "                    </tfoot>",
    "                  </table>",
    "                </div>",
    "              ) : enriched.products && typeof enriched.products === 'string' ? (",
    "                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '0.5rem' }}>",
    "                  <strong>Itens:</strong> {enriched.products}",
    "                </div>",
    "              ) : (",
    "                <p style={{ color: 'var(--text-secondary)' }}>Nenhum produto listado neste pedido.</p>",
    "              )}",
    "            </div>",
    "",
    "            <div className=\"form-actions\" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>",
    "              <button className=\"btn-secondary\" onClick={() => window.print()} style={{ padding: '0.75rem 2rem' }}>Imprimir Recibo</button>",
    "              <button className=\"btn-primary\" onClick={() => setSystemDetailsModal(null)} style={{ padding: '0.75rem 3rem' }}>Fechar</button>",
    "            </div>",
    "          </div>",
    "        </div>",
    "        );",
    "      })()}"
  ];

  lines.splice(start, end - start + 1, ...newModal);
}

fs.writeFileSync('src/App.jsx', lines.join('\r\n'), 'utf8');
console.log('Done!');
