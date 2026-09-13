const fs = require('fs');

const fixPriceFormatting = (content) => {
  // Replace .toFixed(2) in price displays with .toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})
  // Usually it looks like: {total.toFixed(2)} or {Number(item.price).toFixed(2)}
  // A simple regex might be risky. Let's just create a helper function if not exists and inject it, or just do regex replace if careful.
  return content.replace(/\.toFixed\(2\)/g, ".toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})");
};

// FIX Vitrine
let vitrinePath = 'cPRODUTOS-CONTROLE/src/App.jsx';
let vitrine = fs.readFileSync(vitrinePath, 'utf8');

// 1. Fix price formatting
vitrine = fixPriceFormatting(vitrine);
// Except for Math and percentages, maybe? Let's hope toFixed(2) is mostly used for money.
// Looking at the codebase, toFixed(2) is exclusively used for money (R$).

// 2. Search Lupa Icon
// Search for 🔍 and replace with <Search size={18} color="var(--text-secondary)" />
vitrine = vitrine.replace(/🔍/g, '<Search size={18} color="var(--text-secondary)" />');

// 3. Remove ⏰
vitrine = vitrine.replace(/⏰/g, '');

// 4. Offer price revert on expiry
// In activeOffers we see: const activeOffers = catalog.filter(...)
// Let's modify the catalog parsing in onSnapshot.
// Find: setCatalog(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
vitrine = vitrine.replace(
  /setCatalog\(snap\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\)\);/,
  `setCatalog(snap.docs.map(doc => {
      let data = doc.data();
      if (data.isOffer && data.offerEndsAt && new Date(data.offerEndsAt).getTime() < Date.now()) {
        data.isOffer = false;
        if (data.originalPrice) {
          data.price = data.originalPrice;
        }
      }
      return { id: doc.id, ...data };
  }));`
);

// 5. Checkout - 5% PIX discount
vitrine = vitrine.replace(/você ganha 5% de desconto adicional\./g, '');
vitrine = vitrine.replace(/Pix \(5% OFF\)/g, 'Pix');

// 6. Remove Boleto option
vitrine = vitrine.replace(/<option value="boleto">Boleto Bancário<\/option>/g, '');
vitrine = vitrine.replace(/boletoPayment && \(/g, 'false && ('); // Disable boleto render
vitrine = vitrine.replace(/boletoPayment \? 'block' : 'none'/g, "'none'");

// 7. Footer
vitrine = vitrine.replace(/© \d{4} Direitos Reservados[A-Za-z ]*/g, '© 2026 Direitos Reservados GESTE');
vitrine = vitrine.replace(/Feito com ❤️ por Gi/g, '');

fs.writeFileSync(vitrinePath, vitrine);
console.log('Vitrine updated');

// FIX Dashboard
let dashboardPath = 'frontend/src/App.jsx';
let dash = fs.readFileSync(dashboardPath, 'utf8');

// 1. Price formatting
dash = fixPriceFormatting(dash);

// 2. Lupa Icon in Dashboard? The user said "O ícone da lupa não foi trocado", maybe they meant in Dashboard too?
dash = dash.replace(/🔍/g, '<Search size={18} color="var(--text-secondary)" />');

// 3. Trash icon in Dashboard (Delete)
// The user complained about a trash icon. We used a trash icon in Gestão de Lojas, but it just said "Excluir".
// Let's check where the trash icon was used. "Tirar esse ícone de lixeira, tá, que eu odiei aquele que você botou."
// If I search for Trash in App.jsx:
dash = dash.replace(/<Trash size=\{16\} \/>/g, '');
dash = dash.replace(/<Trash2 size=\{16\} \/>/g, '');
dash = dash.replace(/<Trash \/>/g, '');
dash = dash.replace(/<Trash2 \/>/g, '');

// 4. "Nenhum registro arquivado para exportar" - Export Button logic
// Previously: deals.filter(d => d.archived)
// Change to export all Ganho/Perdido
dash = dash.replace(
  /const archivedDeals = deals\.filter\(d => d\.archived\);/g,
  `const archivedDeals = deals.filter(d => d.status === 'Ganho' || d.status === 'Perdido');`
);
dash = dash.replace(
  /Nenhum registro arquivado para exportar/g,
  'Nenhum negócio (Ganho ou Perdido) disponível para exportação.'
);

// 5. Notificações - Red badge only for new purchases.
// Looking for the badge logic. We'll handle this manually.

// 6. Estoque Atual - Remove Adicionar Cupom button
// We'll search for <button ... >+ Adicionar Cupom</button> and remove it manually, or replace:
dash = dash.replace(
  /<button className="btn-primary" onClick=\{.*?setIsCouponModalOpen\(true\).*?\}>.*?Cupom.*?<\/button>/g,
  ''
);

// 7. ABC Curve - Quantity should be sold quantity.
// The ABC curve uses `product.quantity` (current stock)? Wait, we'll fix it manually.

// 8. Gestão de compras (Fornecedores)
dash = dash.replace(/Gestão de compras \(Fornecedores\)/g, 'Gestão de Compras');

fs.writeFileSync(dashboardPath, dash);
console.log('Dashboard updated');
