const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, limit } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyAqSQVMTijY8my5gVW-mc2j0Vn52fGFgvs",
  authDomain: "controle-1bc41.firebaseapp.com",
  projectId: "controle-1bc41",
  storageBucket: "controle-1bc41.firebasestorage.app",
  messagingSenderId: "887559515949",
  appId: "1:887559515949:web:ebd1b0564bf17abeea6da4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    try {
        const compsSnap = await getDocs(collection(db, 'companies'));
        console.log("Companies:", compsSnap.docs.map(d => d.data()));
        
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(5)));
        console.log("Users (up to 5):", usersSnap.docs.map(d => d.data()));

        const custSnap = await getDocs(query(collection(db, 'customers'), limit(5)));
        console.log("Customers (up to 5):", custSnap.docs.map(d => d.data()));

        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
check();
