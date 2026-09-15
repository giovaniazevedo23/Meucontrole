const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyAqSQVMTijY8my5gVW-mc2j0Vn52fGFgvs",
  authDomain: "controle-1bc41.firebaseapp.com",
  projectId: "controle-1bc41",
  storageBucket: "controle-1bc41.firebasestorage.app",
  messagingSenderId: "887559515949",
  appId: "1:887559515949:web:ebd1b0564bf17abeea6da4",
  measurementId: "G-LS0HCTZPFN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
    try {
        const companyCnpj = '19060022000175'; // 19.060.022/0001-75
        const compRef = doc(db, 'companies', companyCnpj);
        await setDoc(compRef, {
            name: 'ENGEMAX CONSTRUTORA LTDA',
            cnpj: '19.060.022/0001-75',
            createdAt: new Date().toISOString()
        }, { merge: true });
        console.log('Company seeded successfully');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
