const fs = require('fs');

let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// 1. Add activeImageIndex state
app = app.replace(
  /const \[viewingProduct, setViewingProduct\] = useState\(null\);/,
  "const [viewingProduct, setViewingProduct] = useState(null);\n  const [activeImageIndex, setActiveImageIndex] = useState(0);"
);

// 2. Add setActiveImageIndex(0) in handleViewProduct
app = app.replace(
  /setViewingProduct\(item\);/,
  "setViewingProduct(item);\n    setActiveImageIndex(0);"
);

// 3. Remove favorite icon from product grid cards
// The code looks like this:
// <div style={{ position: 'absolute', top: '10px', left: item.freeShipping ? '100px' : '10px', zIndex: 11, cursor: 'pointer', background: 'white', borderRadius: '50%', padding: '0.4rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex' }} onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}>
//   <Heart size={18} fill={favorites.find(f => f.sku === item.sku) ? 'var(--danger)' : 'none'} color={favorites.find(f => f.sku === item.sku) ? 'var(--danger)' : '#666'} />
// </div>
const heartCardRegex = /<div style=\{\{ position: 'absolute', top: '10px', left: item\.freeShipping \? '100px' : '10px', zIndex: 11.*?<\/div>/s;
app = app.replace(heartCardRegex, "");

// 4. Update the modal header to include the heart button
const modalHeaderRegex = /<h2 style=\{\{ paddingRight: '2rem' \}\}>\{viewingProduct\.name\}<\/h2>\s*<button className="close-btn" onClick=\{\(\) => setViewingProduct\(null\)\}><\/button>/s;
const modalHeaderNew = `<div style={{ flex: 1 }}>
                  <h2 style={{ paddingRight: '1rem', margin: 0 }}>{viewingProduct.name}</h2>
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(viewingProduct); }}
                  style={{ cursor: 'pointer', padding: '0.2rem', marginRight: '1rem', display: 'flex', alignItems: 'center' }}
                  title="Adicionar aos Favoritos"
                >
                  <Heart size={28} fill={favorites.find(f => f.sku === viewingProduct.sku) ? '#3483fa' : 'none'} color="#3483fa" />
                </div>
                <button className="close-btn" onClick={() => setViewingProduct(null)}></button>`;

app = app.replace(/<h2 style=\{\{ paddingRight: '2rem' \}\}>\{viewingProduct\.name\}<\/h2>\s*<button className="close-btn" onClick=\{\(\) => setViewingProduct\(null\)\}>&times;<\/button>/, modalHeaderNew);
// Also try with actual "x" or "" since it might have encoding issues
app = app.replace(/<h2 style=\{\{ paddingRight: '2rem' \}\}>\{viewingProduct\.name\}<\/h2>\s*<button className="close-btn" onClick=\{\(\) => setViewingProduct\(null\)\}>.*?<\/button>/, modalHeaderNew);


// 5. Update the photo carousel to ML style layout
// We need to replace everything from `{viewingProduct.imageUrls && viewingProduct.imageUrls.length > 0 ? (` to `)}` before `{/* Detalhes */}`
// Actually, it's safer to just split by `{/* Fotos */}` and `{/* Detalhes */}`

const parts = app.split('{/* Detalhes */}');
if (parts.length > 1) {
  const photoParts = parts[0].split('{/* Fotos */}');
  
  const newPhotosHtml = `
                {/* Fotos */}
                <div style={{ width: '100%', background: '#fff', borderRadius: '0.5rem', padding: '1rem', display: 'flex', gap: '1rem', flexDirection: window.innerWidth < 768 ? 'column-reverse' : 'row', alignItems: 'flex-start' }}>
                  {viewingProduct.imageUrls && viewingProduct.imageUrls.length > 1 && (
                    <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'row' : 'column', gap: '0.5rem', overflow: 'auto', maxHeight: window.innerWidth < 768 ? 'none' : '400px' }}>
                      {viewingProduct.imageUrls.map((url, idx) => (
                        <img 
                          key={idx} 
                          src={url} 
                          alt={\`\${viewingProduct.name} \${idx}\`} 
                          onMouseEnter={() => setActiveImageIndex(idx)}
                          onClick={() => setActiveImageIndex(idx)}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'contain', 
                            cursor: 'pointer', 
                            border: activeImageIndex === idx ? '2px solid #3483fa' : '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '2px'
                          }} 
                        />
                      ))}
                    </div>
                  )}
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {viewingProduct.imageUrls && viewingProduct.imageUrls.length > 0 ? (
                      <img 
                        src={viewingProduct.imageUrls[activeImageIndex]} 
                        alt={viewingProduct.name} 
                        style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} 
                      />
                    ) : viewingProduct.imageUrl ? (
                      <img src={viewingProduct.imageUrl} alt={viewingProduct.name} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '100%', height: '300px', background: 'var(--background-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
                        📦
                      </div>
                    )}
                    {viewingProduct.freeShipping && (
                      <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#00a650', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', zIndex: 10 }}>
                        Frete Grátis
                      </div>
                    )}
                  </div>
                </div>
                `;
  
  app = photoParts[0] + newPhotosHtml + '\n                {/* Detalhes */}' + parts[1];
}

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', app, 'utf8');
console.log('Patched modal and heart layout.');
