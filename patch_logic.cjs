const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Ensure Firebase Auth imports are present
if (!app.includes('firebase/auth')) {
  app = app.replace(
    "import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, getDocs, query, where, getDoc, updateDoc } from 'firebase/firestore';",
    "import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, getDocs, query, where, getDoc, updateDoc } from 'firebase/firestore';\nimport { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';"
  );
}

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
        alert('Credenciais inválidas. Verifique seu E-mail e Senha.');
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

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
