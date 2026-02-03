<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erro na Conexão</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }
        .x-mark {
            width: 40px;
            height: 40px;
            position: relative;
        }
        .x-mark::before,
        .x-mark::after {
            content: '';
            position: absolute;
            width: 4px;
            height: 40px;
            background: white;
            left: 18px;
        }
        .x-mark::before {
            transform: rotate(45deg);
        }
        .x-mark::after {
            transform: rotate(-45deg);
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
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <div class="x-mark"></div>
        </div>
        <h1>Erro na Conexão</h1>
        <p style="margin-bottom: 32px;">Houve um problema ao conectar sua conta do Mercado Pago.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <p style="margin: 0; color: #374151; font-weight: 600; font-size: 15px;">
                ⚠ Próximo passo:
            </p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                Feche esta aba do navegador, volte ao aplicativo e tente conectar novamente.
            </p>
        </div>
    </div>
</body>
</html>
