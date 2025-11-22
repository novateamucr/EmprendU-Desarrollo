<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
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
    'avatar_url',
    'confirmation_token',
    'isConfirmed',  // Changed from is_confirmed
    'must_change_password',
];

protected $casts = [
    'banned' => 'boolean',
    'isConfirmed' => 'boolean',  // Changed from is_confirmed
    'must_change_password' => 'boolean',
];
    // Relaciones existentes
    public function roleRelation()
    {
        return $this->belongsTo(UserRole::class, 'role');
    }

    public function getIsConfirmedAttribute()
    {
        return (bool) $this->attributes['isConfirmed'];
    }

    public function getMustChangePasswordAttribute()
    {
        return (bool) ($this->attributes['must_change_password'] ?? false);
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

    // Helper opcional para verificar si el usuario está confirmado
    public function isConfirmed(): bool
    {
        return $this->isConfirmed;
    }

    public function mustChangePassword(): bool
    {
        return $this->must_change_password;
    }

    public function setIsConfirmedAttribute($value)
    {
        $this->attributes['isConfirmed'] = (bool) $value;
    }
}
