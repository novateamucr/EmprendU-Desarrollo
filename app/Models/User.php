<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; // 👈 AGREGA HasApiTokens

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'province',
        'canton',
        'district',
        'address',
        'banned',
        'avatar_url'
    ];

    protected $casts = [
        'banned' => 'boolean',
    ];

    public function roleRelation()
    {
        return $this->belongsTo(UserRole::class, 'role');
    }

    public function interests()
    {
        return $this->hasMany(UserInterest::class);
    }

    public function entrepreneurships()
    {
        return $this->hasMany(Entrepreneurship::class, 'user_id');
    }

    public function favorites()
    {
        return $this->hasMany(UserFavorite::class);
    }

    public function fairs()
    {
        return $this->hasMany(Fair::class);
    }
}
