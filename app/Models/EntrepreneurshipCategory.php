<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntrepreneurshipCategory extends Model
{
    use HasFactory;
    protected $fillable = ['nombre'];

    public function entrepreneurships()
    {
        return $this->hasMany(Entrepreneurship::class, 'category');
    }
}
