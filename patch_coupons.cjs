const fs = require('fs');

let content = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// 1. Change couponDiscountAmt calculation
content = content.replace(
  "const couponDiscountAmt = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0;",
  "const maxPriceItem = cart.reduce((max, c) => c.price > max ? c.price : max, 0);\n      const couponDiscountAmt = appliedCoupon ? (maxPriceItem * appliedCoupon.discount / 100) : 0;"
);
// Replace the one inside the JSX block too
content = content.replace(
  "const couponDiscountAmt = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0;",
  "const maxPriceItem = cart.reduce((max, c) => c.price > max ? c.price : max, 0);\n                        const couponDiscountAmt = appliedCoupon ? (maxPriceItem * appliedCoupon.discount / 100) : 0;"
);
content = content.replace(
  "<span>- R$ {(cart.reduce((a,c) => a + (c.price * c.cartQuantity), 0) * appliedCoupon.discount / 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>",
  "<span>- R$ {(cart.reduce((max, c) => c.price > max ? c.price : max, 0) * appliedCoupon.discount / 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>"
);

// 2. Increment usedCount of appliedCoupon
const incrementLogic = `await setDoc(doc(db, 'deals', deal.id), deal);
        
        if (appliedCoupon) {
          const couponRef = doc(db, 'coupons', appliedCoupon.id);
          const couponDoc = await getDoc(couponRef);
          if (couponDoc.exists()) {
            await updateDoc(couponRef, {
              usedCount: (couponDoc.data().usedCount || 0) + 1
            });
          }
        }`;
content = content.replace("await setDoc(doc(db, 'deals', deal.id), deal);", incrementLogic);
// Also for handlePixPaymentSuccess, which creates a deal if PIX is successful
content = content.replace("await setDoc(doc(db, 'deals', deal.id), deal);", incrementLogic);

// 3. Filter coupons in the list based on minPurchaseValue
content = content.replace(
  "(!c.targetCpf || c.targetCpf === customerInfo.cpf)\n                    ).length > 0 && (",
  "(!c.targetCpf || c.targetCpf === customerInfo.cpf) && (!c.minPurchaseValue || cart.reduce((a,item) => a + (item.price * item.cartQuantity), 0) >= c.minPurchaseValue)\n                    ).length > 0 && ("
);
content = content.replace(
  "(!c.targetCpf || c.targetCpf === customerInfo.cpf)\n                          ).map(c => (",
  "(!c.targetCpf || c.targetCpf === customerInfo.cpf) && (!c.minPurchaseValue || cart.reduce((a,item) => a + (item.price * item.cartQuantity), 0) >= c.minPurchaseValue)\n                          ).map(c => ("
);

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', content, 'utf8');
console.log('Coupon logic updated.');
