const fs = require('fs');

let content = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

// 1. Add chatViewedByAdmin: false when client sends message
content = content.replace(
  "await updateDoc(dealRef, { messages: newMessages });",
  "await updateDoc(dealRef, { messages: newMessages, chatViewedByAdmin: false });"
);

// 2. Fix carousel scroll logic
content = content.replace(
  /scrollBy\(\{left: -300, behavior: 'smooth'\}\)/g,
  "scrollBy({left: -document.getElementById('product-image-carousel').clientWidth, behavior: 'smooth'})"
);
content = content.replace(
  /scrollBy\(\{left: 300, behavior: 'smooth'\}\)/g,
  "scrollBy({left: document.getElementById('product-image-carousel').clientWidth, behavior: 'smooth'})"
);

// 3. Change email colors
// Replace blue gradient with orange
content = content.replace(
  /background: linear-gradient\(135deg, #007bff 0%, #00c6ff 100%\);/g,
  "background: linear-gradient(135deg, #FF921C 0%, #FFA94D 100%);"
);
// Replace #007bff in texts/buttons
content = content.replace(/color: #007bff;/g, "color: #FF921C;");
// Replace #0056b3 (hover state if any, though likely not inline) or other blues
content = content.replace(/border-left: 4px solid #007bff;/g, "border-left: 4px solid #FF921C;");
// Make sure the header is updated
content = content.replace(
  /background: #007bff; color: white;/g,
  "background: #FF921C; color: white;"
);

// We had this in the email:
/*
<div style="background: linear-gradient(135deg, #007bff 0%, #00c6ff 100%); padding: 40px 20px; text-align: center; position: relative;">
...
<div style="background: #f8fbff; border-left: 4px solid #007bff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
...
*/

// Double check the exact string
content = content.replace(/#007bff/g, "#FF921C");
content = content.replace(/#00c6ff/g, "#FFA94D");
content = content.replace(/#f8fbff/g, "#fff7ed"); // Very light orange background

fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', content, 'utf8');
console.log('Client app patched.');
