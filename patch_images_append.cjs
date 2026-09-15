const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const newItemUploadOld = "setNewItem({...newItem, imageUrls: urls, imageUrl: urls[0]});";
const newItemUploadNew = "setNewItem(prev => { const newUrls = [...(prev.imageUrls || []), ...urls]; return {...prev, imageUrls: newUrls, imageUrl: newUrls[0]}; });";
content = content.replace(newItemUploadOld, newItemUploadNew);

const editItemUploadOld = "setEditFormData({...editFormData, imageUrls: urls, imageUrl: urls[0]});";
const editItemUploadNew = "setEditFormData(prev => { const newUrls = [...(prev.imageUrls || []), ...urls]; return {...prev, imageUrls: newUrls, imageUrl: newUrls[0]}; });";
content = content.replace(editItemUploadOld, editItemUploadNew);

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log('Image upload arrays patched to append.');
