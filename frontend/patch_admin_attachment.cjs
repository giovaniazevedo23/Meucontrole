const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Admin uses `msg.text` for messages
content = content.replace(
  /\{msg\.text\}\r?\n\s*<\/div>/g,
  "{msg.text}\n                        </div>\n                        {msg.attachment && <div style={{ marginTop: '0.5rem' }}><img src={msg.attachment} alt=\"Anexo\" style={{ maxWidth: '100%', borderRadius: '4px', maxHeight: '200px' }} /></div>}"
);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Admin app patched to render attachments.');
