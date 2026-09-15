const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Add showPassword state
if (!app.includes('const [showPassword, setShowPassword]')) {
    app = app.replace(
        "const [loginData, setLoginData] = useState({ name: '', email: '', cpf: '', company: '', companyCnpj: '', role: 'Vendedor', phone: '' });",
        "const [loginData, setLoginData] = useState({ name: '', email: '', cpf: '', company: '', companyCnpj: '', role: 'Vendedor', phone: '' });\n  const [showPassword, setShowPassword] = useState(false);"
    );
}

// First password input (login mode)
const oldLoginPass = /<div className="form-group" style=\{\{ marginBottom: '1\.5rem' \}\}>\s*<label>Senha<\/label>\s*<input\s*type="password"\s*required\s*placeholder="Sua senha"\s*value=\{loginData\.password\}\s*onChange=\{e => setLoginData\(\{\.\.\.loginData, password: e\.target\.value\}\)\}\s*\/>\s*<\/div>/;

const newLoginPass = `<div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label>Senha</label>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required 
                          placeholder="Sua senha"
                          value={loginData.password}
                          onChange={e => setLoginData({...loginData, password: e.target.value})}
                          style={{ paddingRight: '40px' }}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>`;

app = app.replace(oldLoginPass, newLoginPass);

// Second password input (register mode)
const oldRegPass = /<div className="form-group" style=\{\{ marginBottom: '1\.5rem' \}\}>\s*<label>Senha<\/label>\s*<input\s*type="password"\s*required\s*placeholder="Crie uma senha \(mínimo 6 caracteres\)"\s*value=\{loginData\.password\}\s*onChange=\{e => setLoginData\(\{\.\.\.loginData, password: e\.target\.value\}\)\}\s*\/>\s*<\/div>/;

const newRegPass = `<div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label>Senha</label>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required 
                          placeholder="Crie uma senha (mínimo 6 caracteres)"
                          value={loginData.password}
                          onChange={e => setLoginData({...loginData, password: e.target.value})}
                          style={{ paddingRight: '40px' }}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>`;

app = app.replace(oldRegPass, newRegPass);

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Password visibility added to frontend');
