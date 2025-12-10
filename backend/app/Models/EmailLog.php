<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    protected $fillable = [
        'template_key',
        'recipient_email',
        'subject',
        'status',
        'sent_at',
        'error_message',
        'metadata',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Scope to get only sent emails
     */
    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    /**
     * Scope to get only failed emails
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope to get only pending emails
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
