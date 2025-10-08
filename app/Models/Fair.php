<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fair extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'title',
        'location',
        'time',
        'image',
        'province',
        'canton',
        'district'
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
