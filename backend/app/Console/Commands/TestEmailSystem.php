<?php

namespace App\Console\Commands;

use App\Jobs\SendEmailJob;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\User;
use Illuminate\Console\Command;

class TestEmailSystem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email? : The email address to send test to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the email system by sending all email templates';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Testing Email System...');
        $this->newLine();

        // Get test email
        $testEmail = $this->argument('email') ?? $this->ask('Enter test email address', 'test@example.com');

        // Check if templates exist in database
        $templates = EmailTemplate::all();
        if ($templates->isEmpty()) {
            $this->error('❌ No email templates found in database!');
            $this->info('💡 Run: php artisan db:seed --class=EmailTemplateSeeder');
            return 1;
        }

        $this->info("✅ Found {$templates->count()} email templates in database");
        $this->newLine();

        // Display templates
        $this->table(
            ['Template Key', 'Name', 'Subject', 'Active'],
            $templates->map(fn($t) => [
                $t->template_key,
                $t->name,
                $t->subject,
                $t->is_active ? '✓' : '✗'
            ])
        );
        $this->newLine();

        if (!$this->confirm('Queue test emails to ' . $testEmail . '?', true)) {
            $this->info('Test cancelled.');
            return 0;
        }

        // Queue all email templates
        $this->info('📧 Queueing test emails...');
        $this->newLine();

        $bar = $this->output->createProgressBar($templates->count());
        $bar->start();

        foreach ($templates as $template) {
            $data = $this->getDummyDataForTemplate($template->template_key);

            SendEmailJob::dispatch(
                $template->template_key,
                $testEmail,
                $data,
                [
                    'test' => true,
                    'command' => 'email:test',
                    'timestamp' => now()->toDateTimeString(),
                ]
            );

            $bar->advance();
            usleep(100000); // Small delay for visual effect
        }

        $bar->finish();
        $this->newLine(2);

        $this->info('✅ All emails queued successfully!');
        $this->newLine();

        // Show queue information
        $this->info('📊 Queue Information:');
        $this->info('   Queue Driver: ' . config('queue.default'));
        $this->info('   Jobs Queued: ' . $templates->count());
        $this->newLine();

        // Check email logs
        $logCount = EmailLog::count();
        $this->info("📝 Email Logs: {$logCount} total emails logged");

        if ($logCount > 0) {
            $sentCount = EmailLog::sent()->count();
            $failedCount = EmailLog::failed()->count();
            $pendingCount = EmailLog::pending()->count();

            $this->info("   ✓ Sent: {$sentCount}");
            $this->info("   ✗ Failed: {$failedCount}");
            $this->info("   ⏳ Pending: {$pendingCount}");
        }

        $this->newLine();
        $this->warn('⚡ To process the queue, run:');
        $this->line('   php artisan queue:work');
        $this->newLine();

        return 0;
    }

    /**
     * Get dummy data for each template type
     */
    private function getDummyDataForTemplate(string $templateKey): array
    {
        return match ($templateKey) {
            'welcome' => [
                'userName' => 'João Silva (Teste)',
                'userEmail' => 'joao@teste.com',
            ],
            'purchase' => [
                'userName' => 'Maria Santos (Teste)',
                'orderNumber' => '#TEST-' . rand(1000, 9999),
                'totalAmount' => 'R$ ' . number_format(rand(500, 5000), 2, ',', '.'),
            ],
            'new_product' => [
                'productName' => 'Anel de Ouro 18k (Teste)',
                'productPrice' => 'R$ ' . number_format(rand(1000, 10000), 2, ',', '.'),
                'productImage' => 'https://via.placeholder.com/300x300',
            ],
            'shipping' => [
                'userName' => 'Pedro Costa (Teste)',
                'orderNumber' => '#TEST-' . rand(1000, 9999),
                'trackingNumber' => 'BR' . rand(100000000, 999999999) . 'BR',
            ],
            default => [],
        };
    }
}
