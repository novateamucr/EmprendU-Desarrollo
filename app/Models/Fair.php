<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fair extends Model
{
    use HasFactory;
    protected $fillable = [
        'description',
        'address',
        'canton',
        'district',
        'location',
        'canton',
        'title',
        'date',
        'time',
        'province',
        'image',
        'user_id',
        'is_active',
    ];
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function entrepreneurships()
    {
        return $this->belongsToMany(Entrepreneurship::class, 'fairs_entrepreneurships', 'fair_id', 'entrepreneurship_id');
    }
}
