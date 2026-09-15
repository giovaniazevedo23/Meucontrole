const fs = require('fs');

let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const oldLogic = /const userRefCheck = doc\(db, 'users', cpfClean\);[\s\S]*?catch\(err\) \{[\s\S]*?return;\s*\}/m;

const newLogic = `try {
            await createUserWithEmailAndPassword(auth, loginData.email, loginData.password);
          } catch(err) {
            if (err.code === 'auth/email-already-in-use') {
               alert('Este e-mail já está em uso no sistema de autenticação.');
            } else {
               alert('Erro ao criar conta: ' + err.message);
            }
            return;
          }

          // Agora que está logado, podemos ler o banco de dados sem erro de permissão
          const userRefCheck = doc(db, 'users', cpfClean);
          let userSnapCheck;
          try {
              userSnapCheck = await getDoc(userRefCheck);
          } catch(dbErr) {
              console.error(dbErr);
          }
          
          if (userSnapCheck && userSnapCheck.exists()) {
            alert('Esse CPF já está vinculado a outro cadastro.');
            return;
          }`;

if(oldLogic.test(app)) {
    app = app.replace(oldLogic, newLogic);
    fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
    console.log('Admin fixed');
} else {
    console.log('Admin old logic not found');
}
