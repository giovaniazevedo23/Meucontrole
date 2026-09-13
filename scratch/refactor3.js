const fs = require('fs');

// -----------------------------------------
// Vitrine App.jsx
// -----------------------------------------
let vitrinePath = 'cPRODUTOS-CONTROLE/src/App.jsx';
let vitrine = fs.readFileSync(vitrinePath, 'utf8');

// 1. In finalizeCheckout, add viewedByAdmin: false when creating a deal
// The creation looks like: await addDoc(collection(db, 'deals'), { ... });
vitrine = vitrine.replace(
  /source: 'vitrine',/g,
  `source: 'vitrine', viewedByAdmin: false,`
);

fs.writeFileSync(vitrinePath, vitrine);
console.log('Vitrine updated (viewedByAdmin)');

// -----------------------------------------
// Dashboard App.jsx
// -----------------------------------------
let dashPath = 'frontend/src/App.jsx';
let dash = fs.readFileSync(dashPath, 'utf8');

// 1. Redefine hasUnreadAdmin
dash = dash.replace(
  /const hasUnreadAdmin = deals\.some\(d => \{.*?\n.*?\n.*?\n.*?\n.*?\n.*?\}\);/s,
  `const hasUnreadAdmin = deals.some(d => d.source === 'vitrine' && d.status !== 'Ganho' && d.status !== 'Perdido' && !d.viewedByAdmin);`
);

// 2. Clear viewedByAdmin when activeTab === 'pedidos'
// We can add a useEffect that watches activeTab and deals.
// Search for `useEffect(() => {` and add it somewhere.
dash = dash.replace(
  /const handleAddItem = async \(e\) => \{/,
  `useEffect(() => {
    if (activeTab === 'pedidos') {
      deals.filter(d => d.source === 'vitrine' && d.status !== 'Ganho' && d.status !== 'Perdido' && !d.viewedByAdmin).forEach(async (d) => {
        try {
          await updateDoc(doc(db, 'deals', d.id), { viewedByAdmin: true });
        } catch(e) {}
      });
    }
  }, [activeTab, deals]);\n\n  const handleAddItem = async (e) => {`
);

// 3. Remove Lupa icon from Vitrine? Wait, I already removed 🔍 but user might have meant something else.
// In Vitrine search:
// `<Search size={18} color="var(--text-secondary)" />` was added. That's fine.

fs.writeFileSync(dashPath, dash);
console.log('Dashboard updated (hasUnreadAdmin)');
