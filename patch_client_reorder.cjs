const fs = require('fs');

let client = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

const oldClientLogic = /const custRefCheck = doc\(db, 'customers', cpfClean\);[\s\S]*?catch\(err\) \{[\s\S]*?return;\s*\}/m;

const newClientLogic = `try {
            await createUserWithEmailAndPassword(auth, loginForm.email, loginForm.password);
          } catch(err) {
            if (err.code === 'auth/email-already-in-use') {
               alert('Este e-mail já está em uso.');
            } else {
               alert('Erro ao criar conta: ' + err.message);
            }
            return;
          }

          const custRefCheck = doc(db, 'customers', cpfClean);
          let custSnapCheck;
          try {
             custSnapCheck = await getDoc(custRefCheck);
          } catch (e) {
             console.error(e);
          }

          if (custSnapCheck && custSnapCheck.exists()) {
            alert('Esse CPF já está vinculado a outro cadastro.');
            return;
          }`;

if(oldClientLogic.test(client)) {
    client = client.replace(oldClientLogic, newClientLogic);
    fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', client, 'utf8');
    console.log('Client fixed');
} else {
    console.log('Client old logic not found');
}
