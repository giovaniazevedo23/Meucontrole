const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /<div className="form-group">\s*<label>Seu Nome<\/label>/;

const replacement = `<div className="form-group">
                <label>Seu E-mail (Acesso)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="email" 
                    value={currentUser.email || ''} 
                    disabled 
                    style={{ flex: 1, backgroundColor: '#f5f5f5', color: '#888' }} 
                  />
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      if (!currentUser.email) return;
                      try {
                        await sendPasswordResetEmail(auth, currentUser.email);
                        alert('Um e-mail para redefinição de senha foi enviado para ' + currentUser.email);
                      } catch (err) {
                        alert('Erro ao enviar e-mail: ' + err.message);
                      }
                    }}
                    style={{ padding: '0 15px', whiteSpace: 'nowrap' }}
                  >
                    Redefinir Senha
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Seu Nome</label>`;

if (regex.test(app)) {
    app = app.replace(regex, replacement);
    fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
    console.log('Profile edit patched');
} else {
    console.log('Regex failed');
}
