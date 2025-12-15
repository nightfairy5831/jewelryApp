<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RingCustomization extends Model
{
    protected $fillable = [
        'size',      // For single rings
        'size_1',    // For wedding rings (male)
        'name_1',    // For wedding rings (male)
        'size_2',    // For wedding rings (female)
        'name_2',    // For wedding rings (female)
    ];
}
