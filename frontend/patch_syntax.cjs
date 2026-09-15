const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetStr = `      })()}
          <div className="modal-overlay">
            <div className="modal-content glass-panel" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <h2>Novo Produto</h2>`;

const replacement = `      })()}
      {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content glass-panel" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <h2>Novo Produto</h2>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacement);
    fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
    console.log('Fixed syntax error in App.jsx');
} else {
    console.log('Could not find target string in App.jsx');
}
