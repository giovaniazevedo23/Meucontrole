const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
const lines = app.split('\n');

// 1. Replace handleEmitNfe
let startHandle = -1;
let endHandle = -1;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('const handleEmitNfe = async')) startHandle = i;
  if (startHandle !== -1 && lines[i].includes('setNfeFormData({')) {
    endHandle = i+5;
    break;
  }
}

const newHandleNfe = `  const handleEmitNfe = async (e) => {
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

if (startHandle !== -1 && endHandle !== -1) {
  lines.splice(startHandle, endHandle - startHandle + 1, newHandleNfe);
}

// 2. Replace the NFE Modal
let startModal = -1;
let endModal = -1;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('{selectedNfeDeal.nfeEmitted ? (')) startModal = i;
  if (startModal !== -1 && lines[i].includes('</form>')) {
    endModal = i+2;
    break;
  }
}

const newModal = `            {selectedNfeDeal.nfeEmitted ? (
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

if (startModal !== -1 && endModal !== -1) {
  lines.splice(startModal, endModal - startModal + 1, newModal);
}

fs.writeFileSync('src/App.jsx', lines.join('\n'), 'utf8');
console.log('Done replacement!');
