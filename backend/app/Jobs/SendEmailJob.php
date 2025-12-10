<?php

namespace App\Jobs;

use App\Mail\DynamicEmail;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $templateKey;
    public $recipientEmail;
    public $data;
    public $metadata;

    /**
     * Create a new job instance.
     */
    public function __construct(string $templateKey, string $recipientEmail, array $data, array $metadata = [])
    {
        $this->templateKey = $templateKey;
        $this->recipientEmail = $recipientEmail;
        $this->data = $data;
        $this->metadata = $metadata;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Get template from database
            $template = EmailTemplate::where('template_key', $this->templateKey)
                ->where('is_active', true)
                ->firstOrFail();

            // Replace variables in template
            $html = $template->replaceVariables($this->data);

            // Send email
            Mail::to($this->recipientEmail)->send(
                new DynamicEmail($template->subject, $html)
            );

            // Log success
            EmailLog::create([
                'template_key' => $this->templateKey,
                'recipient_email' => $this->recipientEmail,
                'subject' => $template->subject,
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => $this->metadata,
            ]);

        } catch (\Exception $e) {
            // Log failure
            EmailLog::create([
                'template_key' => $this->templateKey,
                'recipient_email' => $this->recipientEmail,
                'subject' => $this->templateKey,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'metadata' => $this->metadata,
            ]);

            // Re-throw to mark job as failed
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        // Additional logging or notification could go here
    }
}
