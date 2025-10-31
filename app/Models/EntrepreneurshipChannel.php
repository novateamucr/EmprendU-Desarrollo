<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EntrepreneurshipChannel extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'entrepreneurship_channels';

    protected $fillable = [
        'entrepreneurship_id',
        'platform_code',
        'url',
        'handle',
        'is_primary',
        'is_public'
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_public' => 'boolean'
    ];
    
    protected static function booted()
    {
        static::addGlobalScope('ordered', function ($builder) {
            $builder->orderBy('is_primary', 'desc')
                   ->orderBy('id', 'asc');
        });
    }

    public function entrepreneurship()
    {
        return $this->belongsTo(Entrepreneurship::class);
    }

    public function platform()
    {
        return $this->belongsTo(SocialPlatform::class, 'platform_code', 'code');
    }
}
