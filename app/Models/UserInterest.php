<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserInterest extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $fillable = ['user_id','interest','created_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
