<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'template_key' => 'welcome',
                'name' => 'Email de Boas-vindas',
                'subject' => 'Bem-vindo à Fala!',
                'body_html' => '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo à Fala</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .content h2 { color: #667eea; font-size: 24px; margin-bottom: 20px; }
        .content p { margin-bottom: 15px; font-size: 16px; }
        .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .features { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .features h3 { color: #667eea; margin-bottom: 15px; }
        .features ul { list-style: none; padding: 0; margin: 0; }
        .features li { padding: 8px 0; padding-left: 25px; position: relative; }
        .features li:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
        .footer { background-color: #333333; color: #ffffff; padding: 30px; text-align: center; font-size: 14px; }
        .footer p { margin: 5px 0; }
        .footer a { color: #667eea; text-decoration: none; }
        @media only screen and (max-width: 600px) {
            .content { padding: 20px; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>💎 Fala</h1>
        </div>
        <div class="content">
            <h2>Olá, {{userName}}!</h2>
            <p>Seja muito bem-vindo(a) à <strong>Fala</strong>, sua nova loja de joias online!</p>
            <p>Estamos muito felizes em tê-lo(a) conosco. Aqui você encontrará as mais belas peças de joalheria com preços que acompanham o mercado do ouro em tempo real.</p>
            <div style="text-align: center;">
                <a href="#" class="button">Explorar Nossa Coleção</a>
            </div>
            <div class="features">
                <h3>O que você pode fazer na Fala:</h3>
                <ul>
                    <li>Navegar por centenas de joias exclusivas</li>
                    <li>Visualizar produtos em 3D com rotação 360°</li>
                    <li>Adicionar seus favoritos à lista de desejos</li>
                    <li>Comprar com segurança usando PIX ou cartão de crédito</li>
                    <li>Acompanhar seus pedidos em tempo real</li>
                </ul>
            </div>
            <p><strong>Preços Dinâmicos:</strong> Nossos preços são atualizados automaticamente de acordo com a cotação do ouro, garantindo sempre o melhor valor para você!</p>
            <p>Se você tiver alguma dúvida ou precisar de ajuda, nossa equipe está sempre disponível para atendê-lo(a).</p>
            <p>Aproveite sua experiência de compra!</p>
            <p>Com carinho,<br><strong>Equipe Fala</strong></p>
        </div>
        <div class="footer">
            <p><strong>Fala</strong></p>
            <p>Sua joalheria online de confiança</p>
            <p style="margin-top: 15px;">
                <a href="#">Visite nosso site</a> | <a href="#">Termos</a> | <a href="#">Privacidade</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #999999;">
                Você está recebendo este email porque criou uma conta na Fala.
            </p>
        </div>
    </div>
</body>
</html>',
                'variables' => ['userName', 'userEmail'],
                'is_active' => true,
            ],
            [
                'template_key' => 'purchase',
                'name' => 'Confirmação de Compra',
                'subject' => 'Pedido Confirmado!',
                'body_html' => '<p><strong>Olá {{userName}}!</strong></p><p>Seu pedido <strong>#{{orderNumber}}</strong> foi confirmado com sucesso!</p><p>Valor total: <strong>{{totalAmount}}</strong></p><p>Obrigado por comprar na Fala!</p>',
                'variables' => ['userName', 'orderNumber', 'totalAmount'],
                'is_active' => true,
            ],
            [
                'template_key' => 'new_product',
                'name' => 'Novo Produto (Para Compradores)',
                'subject' => 'Novos Produtos Disponíveis!',
                'body_html' => '<p><strong>Novo Produto Disponível!</strong></p><p>Confira nosso novo produto: <strong>{{productName}}</strong></p><p>Preço: <strong>{{productPrice}}</strong></p><p>Não perca essa oportunidade!</p>',
                'variables' => ['productName', 'productPrice', 'productImage'],
                'is_active' => true,
            ],
            [
                'template_key' => 'product_approved_seller',
                'name' => 'Produto Aprovado (Para Vendedor)',
                'subject' => 'Seu Produto Foi Aprovado!',
                'body_html' => '<p><strong>Parabéns {{sellerName}}!</strong></p><p>Seu produto <strong>{{productName}}</strong> foi aprovado e já está disponível na loja!</p><p>Preço: <strong>{{productPrice}}</strong></p><p>Agora os clientes podem visualizar e comprar seu produto. Boa sorte com as vendas!</p>',
                'variables' => ['sellerName', 'productName', 'productPrice', 'productImage'],
                'is_active' => true,
            ],
            [
                'template_key' => 'shipping',
                'name' => 'Notificação de Envio',
                'subject' => 'Seu Pedido Foi Enviado!',
                'body_html' => '<p><strong>Olá {{userName}}!</strong></p><p>Seu pedido <strong>#{{orderNumber}}</strong> foi enviado!</p><p>Código de rastreamento: <strong>{{trackingNumber}}</strong></p><p>Acompanhe sua entrega!</p>',
                'variables' => ['userName', 'orderNumber', 'trackingNumber'],
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['template_key' => $template['template_key']],
                $template
            );
        }

        $this->command->info('Email templates seeded successfully!');
    }
}
