const fs = require('fs');

let content = fs.readFileSync('cPRODUTOS-CONTROLE/src/App.jsx', 'utf8');

const newAutoReplyHtml = `
                  const autoReplyHtml = \`
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background: #fff; padding: 0; border-radius: 12px; border: 1px solid #eef0f2; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                      
                      <!-- Header Banner -->
                      <div style="background: linear-gradient(135deg, #007bff 0%, #00c6ff 100%); padding: 40px 20px; text-align: center; position: relative;">
                        <!-- Decorações de fundo -->
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.1; background-image: radial-gradient(circle at 10% 20%, #fff 0%, transparent 20%), radial-gradient(circle at 90% 80%, #fff 0%, transparent 20%); pointer-events: none;"></div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: 2px;">GESTE</h1>
                      </div>
                      
                      <!-- Corpo Principal -->
                      <div style="padding: 40px 30px;">
                        <h2 style="color: #1a1a1a; font-size: 20px; margin-top: 0;">Olá, \${customerInfo.name || 'Cliente'}! Tudo bem? 👋</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">Recebemos a sua mensagem e estamos passando para confirmar que a sua solicitação já está em nossas mãos.</p>
                        
                        <div style="background: #f8fafc; border-left: 4px solid #007bff; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                          <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #1a1a1a;">Aqui estão os detalhes do seu atendimento:</h3>
                          <p style="margin: 8px 0; font-size: 15px;">🎫 <strong>Protocolo:</strong> #\${protocolo}</p>
                          <p style="margin: 8px 0; font-size: 15px;">📄 <strong>Status:</strong> Os documentos e informações que você enviou já estão em análise.</p>
                          <p style="margin: 8px 0; font-size: 15px;">⏳ <strong>Prazo de resposta:</strong> Até 72 horas.</p>
                        </div>
                        
                        <h3 style="font-size: 18px; color: #1a1a1a; margin-top: 30px; margin-bottom: 15px;">O que acontece agora?</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                          <li style="font-size: 15px; margin-bottom: 12px; color: #4a5568; display: flex; alignItems: flex-start;">
                            <span style="color: #10b981; font-weight: bold; margin-right: 10px;">✓</span> Um de nossos especialistas vai avaliar o seu caso detalhadamente.
                          </li>
                          <li style="font-size: 15px; margin-bottom: 12px; color: #4a5568; display: flex; alignItems: flex-start;">
                            <span style="color: #10b981; font-weight: bold; margin-right: 10px;">✓</span> Vamos buscar a melhor e mais rápida solução para a sua dúvida ou problema.
                          </li>
                          <li style="font-size: 15px; margin-bottom: 12px; color: #4a5568; display: flex; alignItems: flex-start;">
                            <span style="color: #10b981; font-weight: bold; margin-right: 10px;">✓</span> Enviaremos o retorno diretamente para este e-mail.
                          </li>
                        </ul>
                      </div>
                      
                      <!-- Call to Action Block (Dark Area) -->
                      <div style="background-color: #0f172a; padding: 40px 30px; text-align: center;">
                        <p style="color: #f8fafc; font-size: 16px; font-weight: 500; margin-top: 0; margin-bottom: 25px;">👉 Esqueceu de enviar alguma informação ou anexo?</p>
                        <a href="https://geste.onrender.com" style="background-color: #eab308; color: #0f172a; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(234, 179, 8, 0.25); text-transform: uppercase; letter-spacing: 0.5px;">ATUALIZAR MEU CHAMADO</a>
                      </div>
                      
                      <!-- Conclusão -->
                      <div style="padding: 30px;">
                        <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">Dentro de alguns instantes, alguém da nossa equipe entrará em contato. Fique de olho na sua caixa de entrada (e na pasta de spam, por precaução)!</p>
                        <p style="font-size: 15px; font-weight: bold; color: #1a1a1a; margin-top: 20px;">Até breve 🚀</p>
                      </div>
                      
                      <!-- Footer -->
                      <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <h2 style="color: #007bff; margin: 0 0 10px 0; font-size: 24px; font-weight: 800;">GESTE</h2>
                        <a href="https://geste.onrender.com" style="color: #64748b; text-decoration: none; font-size: 14px; font-weight: 500;">www.geste.onrender.com</a>
                        
                        <!-- Redes Sociais Simbólicas -->
                        <div style="margin: 20px 0;">
                          <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; background: #0f172a; color: white; border-radius: 50%; margin: 0 5px; font-weight: bold; font-size: 14px;">In</span>
                          <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; background: #0f172a; color: white; border-radius: 50%; margin: 0 5px; font-weight: bold; font-size: 14px;">Fb</span>
                          <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; background: #0f172a; color: white; border-radius: 50%; margin: 0 5px; font-weight: bold; font-size: 14px;">Ig</span>
                        </div>
                        
                        <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0 0;">Copyright © 2026 GESTE | <a href="#" style="color: #64748b; text-decoration: underline;">Política de Privacidade</a></p>
                      </div>
                    </div>
                  \`;`;

// Using Regex to replace the previous autoReplyHtml declaration
const oldAutoReplyRegex = /const autoReplyHtml = `[\s\S]*?`;\s*await emailjs/m;
const match = content.match(oldAutoReplyRegex);

if (match) {
  content = content.replace(
    /const autoReplyHtml = `[\s\S]*?`;/m,
    newAutoReplyHtml
  );
  fs.writeFileSync('cPRODUTOS-CONTROLE/src/App.jsx', content, 'utf8');
  console.log('Email template updated successfully.');
} else {
  console.error('Could not find autoReplyHtml to replace.');
}

