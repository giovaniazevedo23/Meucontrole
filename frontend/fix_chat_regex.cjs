const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /<input\s*type="text"\s*placeholder="Digite sua mensagem..."\s*value=\{internalChat\.msg\}\s*onChange=\{e => setInternalChat\(\{\.\.\.internalChat,\s*msg:\s*e\.target\.value\}\)\}\s*style=\{\{[\s\S]*?\}\}\s*\/>/;

const rep = `              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Digite sua mensagem..." 
                  value={internalChat.msg}
                  onChange={e => setInternalChat({...internalChat, msg: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.75rem', borderRadius: '2rem', border: '1px solid #ccc' }}
                />
                <label style={{ position: 'absolute', right: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666' }}>
                  <input type="file" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      alert('Upload de documento em breve: ' + file.name);
                    }
                  }} />
                  <span style={{ fontSize: '1.2rem' }}>📎</span>
                </label>
              </div>`;

if (regex.test(app)) {
  app = app.replace(regex, rep);
  fs.writeFileSync('src/App.jsx', app, 'utf8');
  console.log('Success regex!');
} else {
  console.log('Regex failed');
}
