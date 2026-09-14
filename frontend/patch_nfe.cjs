const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const handleNfeSearch = `  const handleEmitNfe = async (e) => {
    e.preventDefault();
    setIsEmitindoNfe(true);
    
    // Simulate API call to SEFAZ
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'deals', selectedNfeDeal.id), { nfeEmitted: true });
        setSelectedNfeDeal({...selectedNfeDeal, nfeEmitted: true});
        setIsEmitindoNfe(false);
      } catch (err) {
        console.error(err);
        setIsEmitindoNfe(false);
      }
    }, 2500);
  };`;

const handleNfeRep = `  const handleEmitNfe = async (e) => {
    e.preventDefault();
    setIsEmitindoNfe(true);
    
    // Simulate file upload
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'deals', selectedNfeDeal.id), { nfeEmitted: true, nfeFile: 'upload_mock.pdf' });
        setSelectedNfeDeal({...selectedNfeDeal, nfeEmitted: true, nfeFile: 'upload_mock.pdf'});
        setIsEmitindoNfe(false);
      } catch (err) {
        console.error(err);
        setIsEmitindoNfe(false);
      }
    }, 1500);
  };`;
app = app.replace(handleNfeSearch, handleNfeRep);

const uiSearch = `            {selectedNfeDeal.nfeEmitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ color: 'var(--success)', margin: '0 0 1rem 0' }}>NF-e Autorizada!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>A Nota Fiscal Eletrônica desta venda já foi transmitida para a SEFAZ e autorizada com sucesso.</p>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', margin: '2rem 0' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chave de Acesso:</p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 'bold' }}>3526 0900 0000 0000 0100 5500 1000 {Math.floor(100000000 + Math.random() * 900000000)}</p>
                </div>
                <button className="btn-primary" onClick={() => setIsNfeModalOpen(false)}>Fechar</button>
              </div>
            ) : (
              <form onSubmit={handleEmitNfe}>
                {/* 1. Emitente */}
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>1. Emitente</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>Razão Social</label>
                    <input type="text" value={currentUser.company} disabled style={{ background: '#f1f5f9' }} />
                  </div>
                  <div className="form-group">
                    <label>CNPJ</label>
                    <input type="text" value={currentUser.cnpj} disabled style={{ background: '#f1f5f9' }} />
                  </div>
                </div>

                {/* 2. Destinatário */}
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>2. Destinatário</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Nome / Razão Social</label>
                    <input type="text" value={selectedNfeDeal.client} disabled style={{ background: '#f1f5f9' }} />
                  </div>
                  <div className="form-group">
                    <label>CPF / CNPJ</label>
                    <input type="text" required placeholder="000.000.000-00 ou 00.000.000/0001-00" value={nfeFormData.cnpjDestinatario} onChange={e => setNfeFormData({...nfeFormData, cnpjDestinatario: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>CEP</label>
                    <input type="text" required placeholder="00000-000" value={nfeFormData.cepDestinatario} onChange={e => setNfeFormData({...nfeFormData, cepDestinatario: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Endereço Completo</label>
                    <input type="text" required placeholder="Rua, Número, Bairro" value={nfeFormData.enderecoDestinatario} onChange={e => setNfeFormData({...nfeFormData, enderecoDestinatario: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Cidade / UF</label>
                    <input type="text" required placeholder="Ex: São Paulo / SP" value={nfeFormData.cidadeDestinatario} onChange={e => setNfeFormData({...nfeFormData, cidadeDestinatario: e.target.value})} />
                  </div>
                </div>

                {/* 3. Operação */}
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>3. Dados da Operação</h3>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>CFOP (Natureza da Operação)</label>
                  <select value={nfeFormData.cfop} onChange={e => setNfeFormData({...nfeFormData, cfop: e.target.value})}>
                    <option value="5102 - Venda de mercadoria adquirida ou recebida de terceiros">5102 - Venda de mercadoria de terceiros</option>
                    <option value="5101 - Venda de produção do estabelecimento">5101 - Venda de produção própria</option>
                    <option value="6102 - Venda de mercadoria para outro estado">6102 - Venda para outro estado</option>
                  </select>
                </div>

                {/* 4. Produtos */}
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>4. Produtos e Tributos</h3>
                <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Produto (SKU)</th>
                        <th>NCM</th>
                        <th>Qtd</th>
                        <th>V. Unit</th>
                        <th>V. Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedNfeDeal.products.map((p, i) => (
                        <tr key={i}>
                          <td>{p.sku}</td>
                          <td>{nfeFormData.ncm}</td>
                          <td>{p.quantity}</td>
                          <td>R$ {Number(p.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td><strong>R$ {(p.quantity * p.price).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 5. Resumo e Botões */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Impostos Aproximados (ICMS/PIS/COFINS): <strong style={{ color: 'var(--warning)' }}>R$ {(selectedNfeDeal.value * 0.18).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total dos Produtos:</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>R$ {Number(selectedNfeDeal.value).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                <div className="form-actions" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsNfeModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isEmitindoNfe} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', background: 'var(--success)', border: 'none' }}>
                    {isEmitindoNfe ? '📡 Transmitindo SEFAZ...' : '🧾 Emitir NF-e'}
                  </button>
                </div>
              </form>
            )}`;

const uiRep = `            {selectedNfeDeal.nfeEmitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ color: 'var(--success)', margin: '0 0 1rem 0' }}>Upload Concluído!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>A Nota Fiscal Eletrônica desta venda foi anexada com sucesso.</p>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', margin: '2rem 0' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Arquivo anexado:</p>
                  <a href="#" style={{ margin: 0, fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary-color)', textDecoration: 'underline' }}>{selectedNfeDeal.nfeFile || 'nota_fiscal.pdf'}</a>
                </div>
                <button className="btn-primary" onClick={() => setIsNfeModalOpen(false)}>Fechar</button>
              </div>
            ) : (
              <form onSubmit={handleEmitNfe}>
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📎</div>
                  <h3 style={{ marginBottom: '1rem' }}>Anexar Arquivo da Nota Fiscal</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Faça o upload do arquivo PDF ou XML da NF-e referente a esta venda para que fique disponível no painel do cliente.</p>
                  
                  <div style={{ border: '2px dashed var(--glass-border)', padding: '3rem', borderRadius: '1rem', background: 'var(--background-color)', marginBottom: '2rem' }}>
                    <input type="file" id="nfe-upload" accept=".pdf,.xml" required style={{ display: 'none' }} />
                    <label htmlFor="nfe-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ background: 'var(--primary-color)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Selecionar Arquivo</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Formatos suportados: .PDF, .XML</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsNfeModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isEmitindoNfe} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', background: 'var(--success)', border: 'none' }}>
                    {isEmitindoNfe ? '⏳ Fazendo Upload...' : '⬆️ Concluir Upload'}
                  </button>
                </div>
              </form>
            )}`;

app = app.replace(uiSearch, uiRep);

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('Done!');
