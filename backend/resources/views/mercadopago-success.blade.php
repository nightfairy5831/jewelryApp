<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mercado Pago Conectado</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .icon {
            width: 80px;
            height: 80px;
            background: #00d09c;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }
        .checkmark {
            width: 40px;
            height: 40px;
            border: 4px solid white;
            border-radius: 50%;
            position: relative;
        }
        .checkmark::after {
            content: '';
            position: absolute;
            left: 8px;
            top: 3px;
            width: 12px;
            height: 20px;
            border: solid white;
            border-width: 0 4px 4px 0;
            transform: rotate(45deg);
        }
        h1 {
            color: #1a202c;
            font-size: 28px;
            margin-bottom: 16px;
            font-weight: 700;
        }
        p {
            color: #718096;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 14px 32px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(102, 126, 234, 0.3);
            border-radius: 50%;
            border-top-color: #667eea;
            animation: spin 1s linear infinite;
            margin-top: 20px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .note {
            margin-top: 20px;
            font-size: 14px;
            color: #a0aec0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <div class="checkmark"></div>
        </div>
        <h1>Mercado Pago Conectado!</h1>
        <p style="margin-bottom: 32px;">Sua conta foi conectada com sucesso!</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <p style="margin: 0; color: #374151; font-weight: 600; font-size: 15px;">
                ✓ Próximo passo:
            </p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                Feche esta aba do navegador e volte ao aplicativo. Sua conexão já foi salva!
            </p>
        </div>

        <p class="note" style="color: #9ca3af; font-size: 13px;">
            O aplicativo detectará automaticamente a conexão quando você retornar.
        </p>
    </div>
</body>
</html>
