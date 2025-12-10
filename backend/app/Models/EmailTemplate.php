<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $fillable = [
        'template_key',
        'name',
        'subject',
        'body_html',
        'variables',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Replace variables in the template with actual data
     */
    public function replaceVariables(array $data): string
    {
        $html = $this->body_html;

        foreach ($data as $key => $value) {
            // Handle both {{key}} and {{ key }} formats
            $html = str_replace(
                ['{{' . $key . '}}', '{{ ' . $key . ' }}'],
                $value,
                $html
            );
        }

        return $html;
    }

    /**
     * Scope to get only active templates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
