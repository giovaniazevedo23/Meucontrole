const fs = require('fs');

let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// The target is:
// <div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
//    <label>Senha</label>
//    <input ... />
//    <button ... />
// </div>

// We need to wrap the input and button inside a <div style={{ position: 'relative' }}> 
// and remove 'position: relative' from the outer form-group.

// Find the form-group for loginMode === 'login'
const loginModeLoginBlock = app.match(/<div className="form-group" style=\{\{ marginBottom: '1.5rem', position: 'relative' \}\}>\s*<label>Senha<\/label>\s*<input[\s\S]*?<\/button>\s*<\/div>/);

if (loginModeLoginBlock) {
    let newBlock = loginModeLoginBlock[0].replace("position: 'relative'", "");
    newBlock = newBlock.replace(/<input/, "<div style={{ position: 'relative' }}>\n                          <input");
    newBlock = newBlock.replace(/<\/button>\s*<\/div>/, "</button>\n                        </div>\n                      </div>");
    
    app = app.replace(loginModeLoginBlock[0], newBlock);
}

// Find the form-group for loginMode === 'register'
const loginModeRegisterBlock = app.match(/<div className="form-group" style=\{\{ marginBottom: '1.5rem', position: 'relative' \}\}>\s*<label>Senha<\/label>\s*<input[\s\S]*?<\/button>\s*<\/div>/);

if (loginModeRegisterBlock) {
    let newBlock = loginModeRegisterBlock[0].replace("position: 'relative'", "");
    newBlock = newBlock.replace(/<input/, "<div style={{ position: 'relative' }}>\n                          <input");
    newBlock = newBlock.replace(/<\/button>\s*<\/div>/, "</button>\n                        </div>\n                      </div>");
    
    app = app.replace(loginModeRegisterBlock[0], newBlock);
}

fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
console.log('Fixed eye icon wrapper');
