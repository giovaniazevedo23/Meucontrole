const fs = require('fs');

let css = fs.readFileSync('cPRODUTOS-CONTROLE/src/index.css', 'utf8');

// Replace the grid CSS
css = css.replace(
  /\.product-grid \{\s*display: grid;\s*grid-template-columns: repeat\(auto-fill, minmax\(\d+px, 1fr\)\);\s*gap: 1\.5rem;\s*\}/g,
  `.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}`
);

css = css.replace(
  /@media \(max-width: 480px\) \{\s*\.product-grid \{\s*grid-template-columns: repeat\(auto-fill, minmax\(\d+px, 1fr\)\);\s*gap: 1rem;\s*\}\s*\}/g,
  `@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
    gap: 1rem;
  }
}`
);

fs.writeFileSync('cPRODUTOS-CONTROLE/src/index.css', css, 'utf8');

let app = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// Replace inline grid styles with the class
app = app.replace(
  /style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fill, minmax\(150px, 1fr\)\)', gap: '1\.5rem' \}\}/g,
  'className="product-grid"'
);

// We also have the viewed history grid, it was minmax(130px, 1fr). We can also use product-grid for it, or leave it small.
// Let's replace it with product-grid to be consistent, but maybe a bit smaller.
app = app.replace(
  /style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fill, minmax\(130px, 1fr\)\)', gap: '1rem' \}\}/g,
  'className="product-grid"'
);

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', app, 'utf8');
console.log("Grid layout patched");
