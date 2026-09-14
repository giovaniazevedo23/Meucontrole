const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(/<div className="search-bar">[\s\S]*?<\/div>\s*<\/div>/, '</div>');

const stateMatch = "const [searchTerm, setSearchTerm] = useState('');";
if (app.includes(stateMatch)) {
  app = app.replace(stateMatch, stateMatch + '\n  const [sistemaSearch, setSistemaSearch] = useState(\'\');\n  const [systemDetailsModal, setSystemDetailsModal] = useState(null);');
}

const navMatch = "<button className={activeTab === 'config-nfe' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('config-nfe')} style={activeTab !== 'config-nfe' ? { color: 'var(--text-primary)' } : {}}>\n            Configurações NFe\n          </button>";
if (app.includes(navMatch)) {
  app = app.replace(navMatch, "<button className={activeTab === 'sistema' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('sistema')} style={activeTab !== 'sistema' ? { color: 'var(--text-primary)' } : {}}>\n            Sistema\n          </button>");
}

const ext = require('./extracted.json');
let sistemaTab = '';
let modal = '';
ext.forEach(x => {
  if (x.ReplacementChunks) {
    x.ReplacementChunks.forEach(c => {
      if (c.ReplacementContent.includes("activeTab === 'sistema' && (")) sistemaTab = c.ReplacementContent;
      if (c.ReplacementContent.includes("systemDetailsModal && (")) modal = c.ReplacementContent;
    });
  }
  if (x.ReplacementContent && x.ReplacementContent.includes("activeTab === 'sistema' && (")) sistemaTab = x.ReplacementContent;
  if (x.ReplacementContent && x.ReplacementContent.includes("systemDetailsModal && (")) modal = x.ReplacementContent;
});

modal = modal.replace('</main>', '');
const mainEnd = '</main>';
if (app.includes(mainEnd) && sistemaTab && modal) {
  app = app.replace(mainEnd, sistemaTab + '\n\n' + modal + '\n\n' + mainEnd);
}

app = app.replace(
  "        if (m.type === 'ENTRADA') {\n          data[monthIndex].entradas += Number(m.quantity);\n        } else if (m.type === 'SAIDA') {",
  "        if (m.type === 'ENTRADA' || (m.type === 'CADASTRO' && m.quantity)) {\n          data[monthIndex].entradas += Number(m.quantity);\n        } else if (m.type === 'SAIDA') {"
);

// Remove emojis
app = app.replace("📥 Exportar Histórico", "Exportar Histórico");
app = app.replace("📍 Rastreio", "Rastreio");

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('App.jsx reconstructed!');
