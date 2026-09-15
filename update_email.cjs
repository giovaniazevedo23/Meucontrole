const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const oldHtml = /const sellerWelcomeHtml = `[\s\S]*?<\/div>\s*`;/m;

const newHtml = `const sellerWelcomeHtml = \`
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1F2937; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-top: 5px solid #FF921C;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <img src="https://meucontrole-hbe8.onrender.com/favicon.jpg" alt="Logo GESTE" style="width: 80px; height: 80px; border-radius: 16px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
                  <h1 style="color: #FF921C; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">GESTE</h1>
                </div>
                <p style="font-size: 16px; color: #374151;">Olá, <strong>\${loginData.name}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6; color: #4B5563;">É com muita alegria que damos as boas-vindas à GESTE! Estamos muito felizes por você ter nos escolhido para fazer parte da jornada de crescimento da sua empresa. 🚀</p>
                <p style="font-size: 16px; line-height: 1.6; color: #4B5563;">Sabemos que gerenciar um negócio exige muito esforço. Por isso, criamos a GESTE para ser a sua parceira ideal, simplificando sua rotina para que você tenha tempo de focar no que realmente importa: <strong>vender e crescer</strong>.</p>
                
                <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="font-size: 16px; margin-top: 0; font-weight: 600;">Com a nossa plataforma, você tem o controle total do seu negócio em um só lugar:</p>
                    <ul style="font-size: 15px; line-height: 1.7; color: #374151; padding-left: 20px; margin-bottom: 0;">
                      <li>📦 <strong>Gestão de Estoque Inteligente:</strong> Saiba exatamente o que entrou, o que saiu e o que está parado no seu estoque.</li>
                      <li>💰 <strong>Controle Financeiro Descomplicado:</strong> Acompanhe suas finanças de perto, registrando todas as entradas, vendas e lucros com clareza.</li>
                      <li>🛒 <strong>Sua Loja Virtual Integrada:</strong> Ao cadastrar sua empresa, você ganha automaticamente um site exclusivo! Uma plataforma completa onde seus clientes podem visualizar todos os seus produtos e fazer compras de forma rápida e segura.</li>
                    </ul>
                </div>

                <p style="font-size: 16px; text-align: center; margin-top: 30px; font-weight: 600;">Que tal darmos o primeiro passo?</p>
                
                <div style="text-align: center; margin: 25px 0 35px 0;">
                  <a href="https://meucontrole-hbe8.onrender.com" style="background-color: #FF921C; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(255, 146, 28, 0.3);">Acessar Meu Painel GESTE</a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
                
                <p style="font-size: 14px; color: #6B7280; text-align: center;">Se bater alguma dúvida ou precisar de ajuda para configurar sua loja, não se preocupe! Nossa equipe de suporte está sempre à disposição. É só responder a este e-mail.</p>
                <p style="font-size: 16px; font-weight: bold; color: #1F2937; text-align: center; margin-top: 20px;">Desejamos muito sucesso e vendas incríveis!</p>
              </div>
            \`;`;

if (oldHtml.test(app)) {
    app = app.replace(oldHtml, newHtml);
    fs.writeFileSync('frontend/src/App.jsx', app, 'utf8');
    console.log('HTML updated');
} else {
    console.log('Regex failed');
}
