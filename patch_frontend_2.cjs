const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Properly remove emojis from the buttons
content = content.replace(/>[^<]*Importar Planilha/g, ">\n                    Importar Planilha");
content = content.replace(/>[^<]*Adicionar Cupom/g, ">\n                    Adicionar Cupom");

// 2. Fix image upload appending for newItem
const newItemUploadOld = `if(urls.length === files.length) {
                              setNewItem({...newItem, imageUrls: urls, imageUrl: urls[0]});
                            }`;
const newItemUploadNew = `if(urls.length === files.length) {
                              setNewItem(prev => {
                                const newUrls = [...(prev.imageUrls || []), ...urls];
                                return {...prev, imageUrls: newUrls, imageUrl: newUrls[0]};
                              });
                            }`;
content = content.replace(newItemUploadOld, newItemUploadNew);

// 3. Fix image upload appending for editFormData
const editUploadOld = `if(urls.length === files.length) {
                              setEditFormData({...editFormData, imageUrls: urls, imageUrl: urls[0]});
                            }`;
const editUploadNew = `if(urls.length === files.length) {
                              setEditFormData(prev => {
                                const newUrls = [...(prev.imageUrls || []), ...urls];
                                return {...prev, imageUrls: newUrls, imageUrl: newUrls[0]};
                              });
                            }`;
content = content.replace(editUploadOld, editUploadNew);

// Since there are multiple instances in App.jsx (one for newItem, one for editFormData), let's ensure we use global replace if they are identical, 
// but wait, they are different: `setNewItem` vs `setEditFormData`.

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log('Frontend emoji and image upload patched.');
