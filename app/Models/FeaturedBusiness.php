<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeaturedBusiness extends Model
{
    protected $fillable = [
        'business_id',
        'date',
    ];

    public function business()
{
    return $this->belongsTo(Entrepreneurship::class, 'business_id');
}
}

