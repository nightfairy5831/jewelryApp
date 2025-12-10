<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = ['from_user_id', 'to_user_id', 'question', 'answer', 'answered_at'];

    protected $casts = [
        'answered_at' => 'datetime',
    ];

    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser()
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }
}
