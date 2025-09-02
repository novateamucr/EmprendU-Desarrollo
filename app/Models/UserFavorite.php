<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserFavorite extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $fillable = ['user_id','entrepreneurship_id','created_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function entrepreneurship()
    {
        return $this->belongsTo(Entrepreneurship::class);
    }
}
