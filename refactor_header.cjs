const fs = require('fs');

let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// The new search input JSX
const searchJSX = `
          <div className="search-wrapper-container main-search-bar" style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative', margin: '0 1rem' }}>
            <div className="search-input-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
              <input 
                type="text" 
                placeholder="Buscar produtos, marcas e muito mais..." 
                value={searchTerm}
                onFocus={() => setShowSearchHistory(true)}
                onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchHistory(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    const newHistory = [searchTerm.trim(), ...searchHistory.filter(h => h !== searchTerm.trim())].slice(0, 5);
                    setSearchHistory(newHistory);
                    localStorage.setItem('vitrine_search_history', JSON.stringify(newHistory));
                    setShowSearchHistory(false);
                  }
                }}
                style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '24px', border: '1px solid #ccc', outline: 'none', fontSize: '1rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,.1)' }}
              />
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, display: 'flex', alignItems: 'center' }}><Search size={20} color="var(--text-secondary)" /></span>
              
              {showSearchHistory && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 110, overflow: 'hidden', marginTop: '4px' }}>
                  {!searchTerm.trim() && searchHistory.map((h, i) => (
                    <div 
                      key={\`hist-\${i}\`} 
                      onClick={() => { setSearchTerm(h); setShowSearchHistory(false); }}
                      style={{ padding: '0.85rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1rem', color: '#333' }}
                      onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
                      onMouseOut={(e) => e.target.style.background = '#fff'}
                    >
                      <span style={{ opacity: 0.4, fontSize: '1.2rem' }}>🕒</span> {h}
                    </div>
                  ))}

                  {searchTerm.trim() && catalog
                    .filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                    .slice(0, 5)
                    .map((p, i) => (
                      <div 
                        key={\`sug-\${i}\`} 
                        onClick={() => { 
                          setSearchTerm(p.name);
                          const newHistory = [p.name, ...searchHistory.filter(h => h !== p.name)].slice(0, 5);
                          setSearchHistory(newHistory);
                          localStorage.setItem('vitrine_search_history', JSON.stringify(newHistory));
                          setShowSearchHistory(false); 
                        }}
                        style={{ padding: '0.85rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1rem', color: '#333' }}
                        onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
                        onMouseOut={(e) => e.target.style.background = '#fff'}
                      >
                        <span style={{ opacity: 0.4, fontSize: '1.2rem' }}><Search size={18} color="var(--text-secondary)" /></span> 
                        <span>
                          {(p.name || '').toLowerCase().split(searchTerm.toLowerCase()).map((part, index, array) => (
                            <span key={index}>
                              {part}
                              {index < array.length - 1 && <strong>{searchTerm.toLowerCase()}</strong>}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
`;

// Extract Cart Icon JSX
const cartJSX = \`
            <button className="cart-btn-header" onClick={() => setIsCartOpen(true)} style={{ position: 'relative', background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} title="Ver Carrinho">
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-8px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {cart.reduce((a,c) => a + c.cartQuantity, 0)}
                </span>
              )}
            </button>
\`;

// 1. Replace the old header
const oldHeaderStart = '<header className="header glass-panel" style={{ padding: \'1rem 5%\', display: \'flex\', justifyContent: \n\'space-between\', alignItems: \'center\', position: \'relative\', zIndex: 100 }}>';
const oldHeaderStartAlternative = '<header className="header glass-panel" style={{ padding: \'1rem 5%\', display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', position: \'relative\', zIndex: 100 }}>';

const newHeaderStart = \`      <header className="header glass-panel main-top-header" style={{ position: 'relative', zIndex: 100, padding: '1rem 5%' }}>
        <div className="top-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '1rem', flexWrap: 'wrap' }}>
\`;

app = app.replace(oldHeaderStart, newHeaderStart);
app = app.replace(oldHeaderStartAlternative, newHeaderStart);

// Let's insert the search bar after the logo block ends
const logoBlockRegex = /<h1 style=\{\{ margin: 0, fontSize: '1\.5rem', color: '#333', fontWeight: 'bold' \}\}>PRODUTOS<\/h1>\s*<\/div>/;
app = app.replace(logoBlockRegex, \`<h1 className="header-title" style={{ margin: 0, fontSize: '1.5rem', color: '#333', fontWeight: 'bold' }}>PRODUTOS</h1>
          </div>
\${searchJSX}\`);

// Insert cart button into the user menu block
const userMenuStartRegex = /<div style=\{\{ display: 'flex', alignItems: 'center', gap: '1\.5rem', position: 'relative' \}\}>/;
app = app.replace(userMenuStartRegex, \`<div className="user-menu-icons" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
\${cartJSX}\`);

// 2. Now let's find the old search bar in the toolbar and REMOVE it.
// The old search bar was inside:
// <div className="search-wrapper-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end', position: 'relative' }}>
const oldToolbarSearchRegex = /<div className="search-wrapper-container"[\s\S]*?<button className="btn-secondary" onClick=\{\(\) => setIsCartOpen\(true\)\}[\s\S]*?<\/button>\s*<\/div>/;
app = app.replace(oldToolbarSearchRegex, '');

// Also remove the <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}> that was left behind
const remainingSearchWrapRegex = /\{\(activeTab === 'produtos' \|\| activeTab === 'favoritos' \|\| activeTab === 'sugestoes'\) && \(\s*<div className="search-input-wrapper"[^>]*>[\s\S]*?<\/div>\s*\)\}/;
app = app.replace(remainingSearchWrapRegex, '');

// 3. Fix the sub-header navigation (orange bar) to have overflow-x auto
const oldSubNav = '<div style={{ background: \'var(--primary-color)\', padding: \'0.75rem 5%\', display: \'flex\', gap: \'2rem\', alignItems: \'center\', fontSize: \'1rem\', color: \'#fff\', position: \'relative\', zIndex: 90 }}>';
const newSubNav = '<div className="nav-container-scroll" style={{ background: \'var(--primary-color)\', padding: \'0.75rem 5%\', display: \'flex\', gap: \'2rem\', alignItems: \'center\', fontSize: \'1rem\', color: \'#fff\', position: \'relative\', zIndex: 90, overflowX: \'auto\', whiteSpace: \'nowrap\', WebkitOverflowScrolling: \'touch\' }}>';
app = app.replace(oldSubNav, newSubNav);

// Write changes
fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', app, 'utf8');
console.log('App.jsx patched successfully');

// CSS updates
let css = fs.readFileSync('cPRODUTOS-CONTROLE/src/index.css', 'utf8');

css += \`
/* Hide scrollbar for nav-container-scroll but allow scroll */
.nav-container-scroll {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.nav-container-scroll::-webkit-scrollbar {
  display: none;
}

/* Header layout fixes for ML style */
@media (max-width: 768px) {
  .header-title {
    display: none !important; /* Esconde texto "PRODUTOS" no celular para poupar espaco */
  }
  .main-top-header {
    padding: 0.75rem 5% !important;
  }
  .top-header-row {
    flex-wrap: wrap !important;
    gap: 0.5rem !important;
  }
  .main-search-bar {
    order: 3; /* Move a barra de pesquisa para a segunda linha */
    flex-basis: 100% !important;
    margin: 0.5rem 0 0 0 !important;
  }
  .user-menu-icons {
    gap: 1rem !important;
  }
}
\`;

fs.writeFileSync('cPRODUTOS-CONTROLE/src/index.css', css, 'utf8');
console.log('index.css patched successfully');
