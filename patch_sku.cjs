const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Add states for SKU Gen
if (!app.includes('const [skuGenOpen, setSkuGenOpen]')) {
    app = app.replace(
        "const [newItem, setNewItem] = useState({ sku: '', name: '', price: '', minQuantity: '', quantity: '', category: '', brand: '', color: '', size: '' });",
        "const [newItem, setNewItem] = useState({ sku: '', name: '', price: '', minQuantity: '', quantity: '', category: '', brand: '', color: '', size: '' });\n  const [skuGenOpen, setSkuGenOpen] = useState(false);\n  const [skuGen, setSkuGen] = useState({ chars: 4, sep: '-', name: '', char1: '', char2: '', char3: '' });\n\n  const generateSku = () => {\n    let parts = [skuGen.name, skuGen.char1, skuGen.char2, skuGen.char3].filter(Boolean);\n    parts = parts.map(p => p.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, skuGen.chars));\n    setNewItem({...newItem, sku: parts.join(skuGen.sep)});\n  };"
    );
}

const oldSkuInput = /<div className="form-group">\s*<label>SKU<\/label>\s*<input\s*type="text"\s*required\s*value=\{newItem\.sku\}\s*onChange=\{e => setNewItem\(\{\.\.\.newItem, sku: e\.target\.value\}\)\}\s*\/>\s*<\/div>/;

const newSkuInput = `<div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    SKU do Produto
                    <button type="button" onClick={() => setSkuGenOpen(!skuGenOpen)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {skuGenOpen ? 'Ocultar Gerador' : '✨ Usar Gerador Automático'}
                    </button>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={newItem.sku}
                    onChange={e => setNewItem({...newItem, sku: e.target.value.toUpperCase()})}
                    placeholder="Digite ou gere o código do produto"
                  />
                  {skuGenOpen && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Gerador Inteligente de SKU</h4>
                      
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem' }}>Caracteres</label>
                          <select value={skuGen.chars} onChange={e => setSkuGen({...skuGen, chars: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem' }}>Separador</label>
                          <select value={skuGen.sep} onChange={e => setSkuGen({...skuGen, sep: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                            <option value="">Nenhum</option>
                            <option value="-">Hífen (-)</option>
                            <option value="/">Barra (/)</option>
                            <option value="_">Underline (_)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div>
                          <input type="text" placeholder="Nome (Ex: Caneca)" value={skuGen.name} onChange={e => setSkuGen({...skuGen, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                        </div>
                        <div>
                          <input type="text" placeholder="Característica 01 (Ex: 310ml)" value={skuGen.char1} onChange={e => setSkuGen({...skuGen, char1: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                        </div>
                        <div>
                          <input type="text" placeholder="Característica 02 (Ex: Vermelha)" value={skuGen.char2} onChange={e => setSkuGen({...skuGen, char2: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                        </div>
                        <div>
                          <input type="text" placeholder="Característica 03 (Ex: Porcelana)" value={skuGen.char3} onChange={e => setSkuGen({...skuGen, char3: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                        </div>
                      </div>

                      <button type="button" onClick={generateSku} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Gerar e Aplicar Código
                      </button>
                    </div>
                  )}
                </div>`;

if (oldSkuInput.test(app)) {
    app = app.replace(oldSkuInput, newSkuInput);
    fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
    console.log('SKU Generator added');
} else {
    console.log('Regex failed');
}
