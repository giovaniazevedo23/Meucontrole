const fs = require('fs');
let content = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// Global replace for the remaining subtotal * appliedCoupon.discount / 100
content = content.replace(
  /const couponDiscountAmt = appliedCoupon \? \(subtotal \* appliedCoupon\.discount \/ 100\) : 0;/g,
  "const maxPriceItem = cart.reduce((max, c) => c.price > max ? c.price : max, 0);\n      const couponDiscountAmt = appliedCoupon ? (maxPriceItem * appliedCoupon.discount / 100) : 0;"
);

// We should fix the filter logic since it was somewhat broken in the first script for the 'cupons disponíveis' JSX mapping
// The first patch broke because of line breaks. Let's do it carefully with regex.

const regex1 = /\(\!c\.targetCpf \|\| c\.targetCpf === customerInfo\.cpf\)\s*\)\.length > 0 && \(/g;
const replace1 = "(!c.targetCpf || c.targetCpf === customerInfo.cpf) && (!c.minPurchaseValue || cart.reduce((a,item) => a + (item.price * item.cartQuantity), 0) >= c.minPurchaseValue)).length > 0 && (";
content = content.replace(regex1, replace1);

const regex2 = /\(\!c\.targetCpf \|\| c\.targetCpf === customerInfo\.cpf\)\s*\)\.map\(c => \(/g;
const replace2 = "(!c.targetCpf || c.targetCpf === customerInfo.cpf) && (!c.minPurchaseValue || cart.reduce((a,item) => a + (item.price * item.cartQuantity), 0) >= c.minPurchaseValue)).map(c => (";
content = content.replace(regex2, replace2);


fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', content, 'utf8');
console.log('Final coupon logic cleanup.');
