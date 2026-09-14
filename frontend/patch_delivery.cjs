const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update handleCheckout to calculate maxDeliveryDays
const checkoutSearch = `      products: cart.map(c => ({ sku: c.sku, name: c.name, quantity: c.cartQuantity, price: c.price })),
      salesperson: currentUser.name,`;

const checkoutRep = `      products: cart.map(c => ({ sku: c.sku, name: c.name, quantity: c.cartQuantity, price: c.price, deliveryDays: c.deliveryDays || 3 })),
      maxDeliveryDays: Math.max(...cart.map(c => c.deliveryDays || 3), 3),
      salesperson: currentUser.name,`;

app = app.replace(checkoutSearch, checkoutRep);


// 2. Fix UI displays for delivery
const ui1Search = `<div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Rastreio: {deal.shippingStatus || 'Aguardando'}</div>`;
const ui1Rep = `<div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Prazo de Entrega: {deal.maxDeliveryDays || 3} dias úteis</div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Status de Entrega: {deal.shippingStatus || 'Aguardando'}</div>`;
app = app.replace(ui1Search, ui1Rep);

const ui2Search = `<div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Rastreio: {deal.shippingStatus}</div>`;
const ui2Rep = `<div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Prazo de Entrega: {deal.maxDeliveryDays || 3} dias úteis</div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Status de Entrega: {deal.shippingStatus || 'Entregue'}</div>`;
app = app.replace(ui2Search, ui2Rep);

const ui3Search = `                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Rastreio:</span>
                          <span style={{ fontWeight: 'bold' }}>{deal.shippingStatus || 'Aguardando'}</span>
                        </div>`;
const ui3Rep = `                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Prazo de Entrega:</span>
                          <span style={{ fontWeight: 'bold' }}>{deal.maxDeliveryDays || 3} dias úteis</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#666', fontSize: '0.9rem' }}>Status de Entrega:</span>
                          <span style={{ fontWeight: 'bold' }}>{deal.shippingStatus || 'Aguardando'}</span>
                        </div>`;
app = app.replace(ui3Search, ui3Rep);

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('Done patching delivery!');
