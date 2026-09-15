const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Add imports
app = app.replace(
  "import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, getDocs, query, where, getDoc, updateDoc } from 'firebase/firestore';",
  "import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, getDocs, query, where, getDoc, updateDoc } from 'firebase/firestore';\nimport { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';"
);

app = app.replace(
  "import { db } from './firebase';",
  "import { db, auth } from './firebase';"
);

// Add password state
app = app.replace(
  /const \[loginData, setLoginData\] = useState\(\{\s*email: '',\s*cpf: '',\s*name: '',\s*company: '',\s*companyCnpj: '',\s*role: 'Vendedor',\s*phone: ''\s*\}\);/,
  `const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    cpf: '',
    name: '',
    company: '',
    companyCnpj: '',
    role: 'Vendedor',
    phone: ''
  });`
);

// Add Forgot Password logic
const handleLoginStart = 'const handleLogin = async (e) => {';
const forgotPasswordFunc = `const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!loginData.email) {
      alert('Por favor, informe seu e-mail de cadastro no campo "E-mail" e clique em "Esqueci minha senha" novamente.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginData.email);
      alert('Se o e-mail estiver cadastrado, um link de restauração de senha foi enviado para ele!');
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar e-mail de recuperação.');
    }
  };

  `;
app = app.replace(handleLoginStart, forgotPasswordFunc + handleLoginStart);

// Rewrite login mode to use Firebase Auth
const oldLoginLogic = `    if (loginMode === 'login') {
      const userRef = doc(db, 'users', cpfClean);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setCurrentUser({...userData, companyCnpj: userData.companyCnpj || '00.000.000/0001-00'});
      } else {
        alert("Usuário não encontrado. Por favor, faça o cadastro.");
      }
    } else {`;

const newLoginLogic = `    if (loginMode === 'login') {
      try {
        if (!loginData.email || !loginData.password) {
          alert('Por favor, preencha E-mail e Senha para entrar.');
          return;
        }
        await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
        
        const userRef = doc(db, 'users', cpfClean);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setCurrentUser({...userData, companyCnpj: userData.companyCnpj || '00.000.000/0001-00'});
        } else {
          alert("Dados adicionais do usuário não encontrados no banco.");
        }
      } catch (error) {
        console.error(error);
        alert('Credenciais inválidas. Verifique seu E-mail, Senha e CPF.');
      }
    } else {`;

app = app.replace(oldLoginLogic, newLoginLogic);

// Rewrite register logic to use Firebase Auth
const oldRegLogic = `        const emailQuery = query(collection(db, 'users'), where('email', '==', loginData.email));
        const emailSnap = await getDocs(emailQuery);
        if (!emailSnap.empty) {
          alert('Esse E-mail já está vinculado a outro cadastro.');
          return;
        }

        const userDoc = {
          name: loginData.name,
          email: loginData.email,`;

const newRegLogic = `        const emailQuery = query(collection(db, 'users'), where('email', '==', loginData.email));
        const emailSnap = await getDocs(emailQuery);
        if (!emailSnap.empty) {
          alert('Esse E-mail já está vinculado a outro cadastro.');
          return;
        }

        if (!loginData.password || loginData.password.length < 6) {
          alert('A senha deve ter no mínimo 6 caracteres.');
          return;
        }

        try {
          await createUserWithEmailAndPassword(auth, loginData.email, loginData.password);
        } catch(err) {
          if (err.code === 'auth/email-already-in-use') {
             alert('Este e-mail já está em uso no sistema de autenticação.');
          } else {
             alert('Erro ao criar conta: ' + err.message);
          }
          return;
        }

        const userDoc = {
          name: loginData.name,
          email: loginData.email,`;

app = app.replace(oldRegLogic, newRegLogic);

// Add JSX for password fields and forgot password button
// Find the Email block in register
const oldEmailInput = `<div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>E-mail</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="Seu melhor e-mail"
                        value={loginData.email}
                        onChange={e => setLoginData({...loginData, email: e.target.value})}
                      />
                    </div>`;

const newEmailInputReg = `<div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>E-mail</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="Seu melhor e-mail"
                        value={loginData.email}
                        onChange={e => setLoginData({...loginData, email: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Senha</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="Crie uma senha forte (mínimo 6 caracteres)"
                        value={loginData.password}
                        onChange={e => setLoginData({...loginData, password: e.target.value})}
                      />
                    </div>`;

app = app.replace(oldEmailInput, newEmailInputReg);

// Add email, password and forgot password button to the LOGIN block.
const oldCpfInput = `                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>CPF</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="000.000.000-00"
                    value={loginData.cpf}
                    onChange={handleCpfChange}
                    maxLength="14"
                  />
                </div>`;

const newLoginInputs = `                {loginMode === 'login' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>E-mail</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="Seu e-mail cadastrado"
                        value={loginData.email}
                        onChange={e => setLoginData({...loginData, email: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Senha</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="Sua senha"
                        value={loginData.password}
                        onChange={e => setLoginData({...loginData, password: e.target.value})}
                      />
                    </div>
                  </>
                )}
                
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>CPF</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="000.000.000-00"
                    value={loginData.cpf}
                    onChange={handleCpfChange}
                    maxLength="14"
                  />
                </div>
`;

app = app.replace(oldCpfInput, newLoginInputs);

// Add the 'Esqueci minha senha' button to the form, right above the submit button
const oldSubmitButton = `<button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>`;

const newSubmitButton = `{loginMode === 'login' && (
                  <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                    <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--brand-orange)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.9rem' }}>
                      Esqueci minha senha
                    </button>
                  </div>
                )}
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>`;

app = app.replace(oldSubmitButton, newSubmitButton);

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Admin Auth logic and UI patched.');
