const fs = require('fs');

let vitrineApp = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// 1. Remove PIX 5% text
vitrineApp = vitrineApp.replace(
  /<option value="PIX">PIX \(5% Desconto Adicional\)<\/option>/g,
  '<option value="PIX">PIX</option>'
);

// 2. Remove PIX 5% discount logic (appears a few times in the file)
vitrineApp = vitrineApp.replace(
  /const pixDiscountAmt = checkoutMethod === 'PIX' \? \(\(subtotal - couponDiscountAmt\) \* 0\.05\) : 0;/g,
  'const pixDiscountAmt = 0;'
);

// 3. Update coupon logic to use `usedBy` array.
// Where it validates a coupon in `validCoupon = coupons.find(...)`
vitrineApp = vitrineApp.replace(
  /if \(c\.usageLimit && \(c\.usedCount \|\| 0\) >= c\.usageLimit\) return false;/g,
  `if (c.usageLimit && (c.usedCount || 0) >= c.usageLimit) return false;\n                              if (customerInfo && c.usedBy && c.usedBy.includes(customerInfo.cpf)) return false;`
);

// 4. Also update the coupons list filter where it shows available coupons
vitrineApp = vitrineApp.replace(
  /\(\!c\.usageLimit \|\| \(c\.usedCount \|\| 0\) < c\.usageLimit\) &&/g,
  `(!c.usageLimit || (c.usedCount || 0) < c.usageLimit) && (!customerInfo || !c.usedBy || !c.usedBy.includes(customerInfo.cpf)) &&`
);

// 5. Where the coupon is consumed during checkout (updateDoc for couponRef)
// It looks like:
// await updateDoc(couponRef, { usedCount: (couponDoc.data().usedCount || 0) + 1 });
vitrineApp = vitrineApp.replace(
  /await updateDoc\(couponRef, \{([\s\S]*?)usedCount: \(couponDoc\.data\(\)\.usedCount \|\| 0\) \+ 1([\s\S]*?)\}\);/g,
  `const currentUsedBy = couponDoc.data().usedBy || [];
              const updatedUsedBy = customerInfo && customerInfo.cpf ? [...currentUsedBy, customerInfo.cpf] : currentUsedBy;
              await updateDoc(couponRef, {$1usedCount: (couponDoc.data().usedCount || 0) + 1, usedBy: updatedUsedBy$2});`
);

// 6. Fix the "esgotado" check in the coupon tab
vitrineApp = vitrineApp.replace(
  /const isExhausted = coupon\.usageLimit && \(coupon\.usedCount \|\| 0\) >= coupon\.usageLimit;/g,
  `const isExhausted = coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit;
                  const alreadyUsed = customerInfo && coupon.usedBy && coupon.usedBy.includes(customerInfo.cpf);`
);

// And we should probably disable the button if alreadyUsed
vitrineApp = vitrineApp.replace(
  /isUnavailable \? \(\n\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '0\.5rem' \}\}>\n\s*<span style=\{\{ color: 'var\(--danger\)', fontWeight: 'bold' \}\}>\{isExpired \? 'Expirado' : 'Esgotado'\}<\/span>/,
  `(isUnavailable || alreadyUsed) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{alreadyUsed ? 'Já Utilizado' : (isExpired ? 'Expirado' : 'Esgotado')}</span>`
);


fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', vitrineApp, 'utf8');
console.log('Vitrine PIX & Coupon patched');
