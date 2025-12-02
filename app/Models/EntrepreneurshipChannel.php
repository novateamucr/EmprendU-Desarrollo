<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EntrepreneurshipChannel extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'entrepreneurship_id',
        'channel_type',
        'channel_url',
        'channel_username',
        'handle',
        'is_primary',
        'is_public',
        'display_order',
    ];

    protected $casts = [
        'is_primary' => 'bool',
        'is_public'  => 'bool',
    ];

    public function platform()
    {
        return $this->belongsTo(SocialPlatform::class, 'channel_type', 'code');
    }

    public function entrepreneurship()
    {
        return $this->belongsTo(Entrepreneurship::class);
    }
}
