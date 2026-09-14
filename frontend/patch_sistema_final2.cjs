const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
const lines = app.split('\r\n');
console.log('Total lines:', lines.length);

// 1. Fix tab name "Sistemas" -> "Sistema"
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('>Sistemas<')) {
    lines[i] = lines[i].replace('>Sistemas<', '>Sistema<');
    console.log('Fixed tab name at line', i);
  }
}

// 2. Find and replace the search input block (add SVG lupa + change placeholder)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('placeholder="Buscar por cliente, CPF, pedido, NFe..."')) {
    // Fix placeholder
    lines[i] = lines[i].replace('placeholder="Buscar por cliente, CPF, pedido, NFe..."', 'placeholder="Buscar por nome ou SKU..."');
    console.log('Fixed placeholder at line', i);
  }
  if (lines[i].includes("padding: '1rem 1rem 1rem 1rem'")) {
    lines[i] = lines[i].replace("padding: '1rem 1rem 1rem 1rem'", "padding: '1rem 1rem 1rem 3.25rem', boxSizing: 'border-box'");
    console.log('Fixed padding at line', i);
  }
}

// Find the <input line for the search and add SVG before it
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('sistemaSearch') && lines[i].includes('onChange')) {
    // Go back to find the <input line
    let inputLine = i;
    while (inputLine > 0 && !lines[inputLine].trim().startsWith('<input')) inputLine--;
    // Insert SVG icon before the <input
    const svgLines = [
      '                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: \'absolute\', left: \'1.25rem\', top: \'50%\', transform: \'translateY(-50%)\', width: \'1.25rem\', height: \'1.25rem\', color: \'var(--text-secondary)\', pointerEvents: \'none\', zIndex: 1 }}>',
      '                  <circle cx="11" cy="11" r="8"></circle>',
      '                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
      '                </svg>'
    ];
    lines.splice(inputLine, 0, ...svgLines);
    console.log('Added SVG lupa at line', inputLine);
    break;
  }
}

// 3. Find the data logic block and replace it
// Find {(() => { that contains sistemaSearch
let dataStart = -1;
let dataEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('sistemaSearch.toLowerCase()') && lines[i-1] && lines[i-1].includes('{(() => {')) {
    dataStart = i - 1;
  }
  if (dataStart > -1 && lines[i].trim() === '})()}') {
    dataEnd = i;
    break;
  }
}

console.log('Data logic block:', dataStart, '-', dataEnd);

if (dataStart > -1 && dataEnd > -1) {
  const newDataBlock = [
    '              {(() => {',
    '                const s = sistemaSearch.toLowerCase();',
    '                ',
    "                // Merge data: deals (Firestore) + sheetsData (Pedidos vitrine)",
    "                const sheetPedidos = (sheetsData['Pedidos vitrine'] || []).map((row, i) => ({",
    "                  id: 'pv-' + i,",
    "                  client: row['USUARIO'] || '',",
    "                  cpf: row['CPF'] || '',",
    "                  email: row['EMAIL'] || '',",
    "                  address: row['ENDEREÇO'] || '',",
    "                  phone: row['N° DE TEEFONE'] || '',",
    "                  date: row['DATA E HORA DO PEDIDO'] || '',",
    "                  products: row['ITEM COMPRADO'] || '',",
    "                  salesperson: row['VENDEDOR ESCOLHIDO'] || '',",
    "                  maxDeliveryDays: row['PRAZO DE ENTREGA'] || '',",
    "                  quantity: row['QUANTIDADE'] || 1,",
    "                  paymentMethod: row['METODO DE PAGAMENTO'] || '',",
    "                  source: 'vitrine',",
    "                  status: row['STATUS DE ENTREGA'] || 'Pendente',",
    "                  shippingStatus: row['STATUS DE ENTREGA'] || 'Aguardando',",
    "                  _origin: 'planilha'",
    '                }));',
    '                ',
    "                const allRecords = [...deals.map(d => ({...d, _origin: 'firebase'})), ...sheetPedidos];",
    '                ',
    '                if (!s) {',
    '                  return (',
    "                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: '#999' }}>",
    "                      <h3 style={{ margin: '0 0 0.5rem 0' }}>Pesquisar Registros</h3>",
    '                      <p>Digite o nome do cliente, CPF, ID do pedido ou NFe na barra de busca para encontrar os registros.</p>',
    '                    </div>',
    '                  );',
    '                }',
    '                const filtered = allRecords.filter(d => ',
    '                  (d.client && d.client.toLowerCase().includes(s)) ||',
    '                  (d.cpf && d.cpf.includes(s)) ||',
    '                  (d.customerCpf && d.customerCpf.includes(s)) ||',
    '                  (d.id && d.id.toLowerCase().includes(s)) ||',
    "                  (d.products && typeof d.products === 'string' && d.products.toLowerCase().includes(s))",
    '                );',
    '                ',
    '                if (filtered.length === 0) {',
    '                  return (',
    "                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: '#999' }}>",
    '                      <p>Nenhum registro encontrado para a sua busca.</p>',
    '                    </div>',
    '                  );',
    '                }',
    '                ',
    '                return filtered.map((deal, idx) => {',
    '                  return (',
    "                    <div key={deal.id || ('rec-' + idx)} className=\"glass-panel\" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${deal.source === 'vitrine' ? 'var(--primary-color)' : 'var(--warning)'}` }}>",
    "                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>",
    '                        <div>',
    "                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{deal.client || 'Cliente não informado'}</div>",
    "                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{deal.date ? new Date(deal.date).toLocaleDateString('pt-BR') : ''}</div>",
    '                        </div>',
    "                        <span style={{ fontSize: '0.8rem', background: deal._origin === 'planilha' ? '#d4edda' : '#eee', padding: '2px 8px', borderRadius: '10px' }}>{deal._origin === 'planilha' ? 'Planilha' : '#' + deal.id.slice(-6)}</span>",
    '                      </div>',
    '                      ',
    "                      <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '0.5rem', flex: 1 }}>",
    "                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>",
    "                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Status:</span>",
    "                          <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{deal.status}</span>",
    '                        </div>',
    "                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>",
    "                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Prazo de Entrega:</span>",
    "                          <span style={{ fontWeight: 'bold' }}>{deal.maxDeliveryDays || 3} dias úteis</span>",
    '                        </div>',
    "                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>",
    "                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Status de Entrega:</span>",
    "                          <span style={{ fontWeight: 'bold' }}>{deal.shippingStatus || 'Aguardando'}</span>",
    '                        </div>',
    '                        {deal.value || deal.total ? (',
    "                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>",
    "                            <span style={{ color: '#666', fontSize: '0.9rem' }}>Valor Total:</span>",
    "                            <span style={{ fontWeight: 'bold' }}>R$ {Number(deal.value || deal.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>",
    '                          </div>',
    '                        ) : null}',
    "                        {deal._origin === 'planilha' && deal.products ? (",
    "                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>",
    "                            <span style={{ color: '#666', fontSize: '0.9rem' }}>Produto:</span>",
    "                            <span style={{ fontWeight: 'bold', textAlign: 'right', maxWidth: '60%' }}>{deal.products}</span>",
    '                          </div>',
    '                        ) : null}',
    '                      </div>',
    '',
    "                      <div style={{ display: 'flex', gap: '0.5rem' }}>",
    "                        <button className=\"btn-secondary\" style={{ flex: 1, padding: '0.5rem' }} onClick={() => {",
    '                          const num = deal.phone || deal.customerPhone;',
    '                          if (num) {',
    "                            const cleanNum = num.replace(/\\D/g, '');",
    "                            window.open(`https://wa.me/55${cleanNum}`, '_blank');",
    "                          } else alert('Telefone não informado');",
    '                        }}>WhatsApp</button>',
    "                        <button className=\"btn-primary\" style={{ flex: 1, padding: '0.5rem' }} onClick={() => setSystemDetailsModal(deal)}>",
    '                          Detalhes',
    '                        </button>',
    '                      </div>',
    '                    </div>',
    '                  );',
    '                });',
    '              })()}'
  ];
  
  lines.splice(dataStart, dataEnd - dataStart + 1, ...newDataBlock);
  console.log('Data logic replaced successfully');
}

// 4. Add auto-load useEffect for sheetsData when Sistema tab is opened
let handleLoadIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleLoadSheets = async () => {')) {
    handleLoadIdx = i;
    break;
  }
}

if (handleLoadIdx > -1 && !lines.some(l => l.includes("activeTab === 'sistema' && !sheetsLoaded"))) {
  const autoLoadLines = [
    "    // Auto-load sheets when Sistema tab is opened",
    "    React.useEffect(() => {",
    "      if (activeTab === 'sistema' && !sheetsLoaded && !sheetsLoading) {",
    "        handleLoadSheets();",
    "      }",
    "    }, [activeTab]);",
    ""
  ];
  lines.splice(handleLoadIdx, 0, ...autoLoadLines);
  console.log('Auto-load effect added at line', handleLoadIdx);
}

// Write back
fs.writeFileSync('src/App.jsx', lines.join('\r\n'), 'utf8');
console.log('Done!');
