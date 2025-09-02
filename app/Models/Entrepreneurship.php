<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Entrepreneurship extends Model
{
    use HasFactory;
    protected $fillable = ['name','description','category','image_url','user_id'];

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function categoryRelation()
    {
        return $this->belongsTo(EntrepreneurshipCategory::class, 'category');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function fairs()
    {
        return $this->belongsToMany(Fair::class, 'fairs_entrepreneurships', 'entrepreneurship_id', 'fair_id');
    }

    public function favorites()
    {
        return $this->hasMany(UserFavorite::class);
    }
}
