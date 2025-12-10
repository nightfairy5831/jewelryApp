<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendEmailJob;
use App\Models\EmailTemplate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class EmailController extends Controller
{
    /**
     * Show the email management page
     */
    public function index()
    {
        // Fetch templates from database
        $templates = EmailTemplate::all();

        $emailTemplates = $templates->map(function ($template) {
            return [
                'id' => $template->template_key,
                'name' => $template->name,
                'subject' => $template->subject,
                'description' => $this->getTemplateDescription($template->template_key),
                'variables' => array_map(function ($var) {
                    return '{{' . $var . '}}';
                }, $template->variables ?? []),
            ];
        });

        return Inertia::render('Admin/Emails', [
            'emailTemplates' => $emailTemplates,
        ]);
    }

    /**
     * Get template description based on template key
     */
    private function getTemplateDescription(string $key): string
    {
        return match ($key) {
            'welcome' => 'Enviado quando um novo usuário se registra',
            'purchase' => 'Enviado após conclusão da compra',
            'new_product' => 'Enviado quando novos produtos são adicionados',
            'shipping' => 'Enviado quando o vendedor envia o produto',
            default => 'Template de email personalizado',
        };
    }

    /**
     * Get email template content from database
     */
    public function getTemplate($templateId)
    {
        $template = EmailTemplate::where('template_key', $templateId)->first();

        if (!$template) {
            return response()->json(['error' => 'Template not found'], 404);
        }

        return response()->json([
            'content' => $template->body_html,
        ]);
    }

    /**
     * Update email template in database
     */
    public function updateTemplate(Request $request, $templateId)
    {
        $request->validate([
            'content' => 'required|string',
        ]);

        $template = EmailTemplate::where('template_key', $templateId)->first();

        if (!$template) {
            return response()->json(['error' => 'Template not found'], 404);
        }

        $template->update([
            'body_html' => $request->content,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template atualizado com sucesso!',
        ]);
    }

    /**
     * Preview email template from database
     */
    public function preview(Request $request, $templateId)
    {
        try {
            // Get template from database or use provided content
            if ($request->has('content')) {
                $html = $request->input('content');
            } else {
                $template = EmailTemplate::where('template_key', $templateId)->first();
                if (!$template) {
                    return response()->json(['error' => 'Template not found'], 404);
                }
                $html = $template->body_html;
            }

            // Get dummy data based on template type
            $dummyData = $this->getDummyData($templateId);

            // Replace variables
            foreach ($dummyData as $key => $value) {
                $html = str_replace(['{{' . $key . '}}', '{{ ' . $key . ' }}'], $value, $html);
            }

            // Wrap in HTML structure if needed
            if (!str_contains($html, '<!DOCTYPE') && !str_contains($html, '<html')) {
                $html = '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body>' . $html . '</body>
</html>';
            }

            return response($html, 200)
                ->header('Content-Type', 'text/html');
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to render template',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dummy data for preview based on template type
     */
    private function getDummyData(string $templateKey): array
    {
        return match ($templateKey) {
            'welcome' => [
                'userName' => 'João Silva',
                'userEmail' => 'joao@example.com',
            ],
            'purchase' => [
                'userName' => 'João Silva',
                'orderNumber' => '#12345',
                'totalAmount' => 'R$ 1.250,00',
            ],
            'new_product' => [
                'productName' => 'Anel de Ouro 18k',
                'productPrice' => 'R$ 2.500,00',
                'productImage' => 'https://via.placeholder.com/300x300',
            ],
            'shipping' => [
                'userName' => 'João Silva',
                'orderNumber' => '#12345',
                'trackingNumber' => 'BR123456789BR',
            ],
            default => [],
        };
    }

    /**
     * Send custom email to any address (queued)
     */
    public function sendEmail(Request $request)
    {
        $request->validate([
            'to_email' => 'required|email',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        try {
            // Send directly using Mail facade for custom messages (not queued for admin testing)
            Mail::send([], [], function ($message) use ($request) {
                $message->to($request->to_email)
                    ->subject($request->subject)
                    ->html($request->message);
            });

            return response()->json([
                'success' => true,
                'message' => 'Email enviado com sucesso!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao enviar email: ' . $e->getMessage(),
            ], 500);
        }
    }

}
